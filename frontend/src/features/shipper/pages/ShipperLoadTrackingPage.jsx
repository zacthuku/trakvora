import { useCallback, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Navigation2, Wifi, WifiOff, Clock, MapPin,
  Package, Truck, ArrowRight, GripHorizontal, ZoomIn,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { shipperApi } from "@/features/shipper/api/shipperApi";
import { useTrackingSocket } from "@/hooks/useWebSocket";
import { formatKES } from "@/utils/currency";

// Fix default leaflet marker icons (broken in Vite/webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const truckIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background:#fe6a34;border:2px solid white;border-radius:50%;
    width:20px;height:20px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
  ">🚛</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const STATUS_STEPS = [
  { key: "booked",          label: "Booked",      desc: "Carrier confirmed, awaiting dispatch" },
  { key: "en_route_pickup", label: "En Route",     desc: "Driver heading to your pickup location" },
  { key: "loaded",          label: "Loaded",       desc: "Cargo loaded and secured on truck" },
  { key: "in_transit",      label: "In Transit",   desc: "Truck is moving towards destination" },
  { key: "delivered",       label: "Delivered",    desc: "Delivery complete — release escrow to pay" },
];

const STATUS_COLORS = {
  booked:          "bg-violet-500",
  en_route_pickup: "bg-sky-500",
  loaded:          "bg-blue-500",
  in_transit:      "bg-[#4fdbcc]",
  delivered:       "bg-primary",
};

function MapFlyTo({ lat, lng }) {
  const map = useMap();
  map.flyTo([lat, lng], map.getZoom(), { duration: 1 });
  return null;
}

function ResizableMap({ lat, lng, shipmentId }) {
  const { lastMessage, connected } = useTrackingSocket(shipmentId);
  const liveLat = lastMessage?.latitude ?? lat;
  const liveLng = lastMessage?.longitude ?? lng;

  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [mapH, setMapH] = useState(340);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = mapH;
    e.preventDefault();
  }, [mapH]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    setMapH(Math.max(200, Math.min(700, startH.current + delta)));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4 text-secondary" />
          <span className="font-heading font-semibold text-slate-800 text-sm">Live Location</span>
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${connected ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
            {connected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Polling</>}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <ZoomIn className="w-3 h-3" /> Scroll to zoom · Drag to pan
        </span>
      </div>

      <div style={{ height: mapH }} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer
          center={[liveLat, liveLng]}
          zoom={12}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[liveLat, liveLng]} icon={truckIcon}>
            <Popup>Truck is here · {liveLat.toFixed(5)}, {liveLng.toFixed(5)}</Popup>
          </Marker>
          {lastMessage && <MapFlyTo lat={liveLat} lng={liveLng} />}
        </MapContainer>
      </div>

      {/* Drag handle */}
      <div
        ref={dragRef}
        onMouseDown={onMouseDown}
        className="flex items-center justify-center h-6 cursor-row-resize hover:bg-slate-100 rounded-b-xl transition-colors group"
        title="Drag to resize map"
      >
        <GripHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>

      <p className="text-[10px] text-slate-400 font-mono mt-1 text-right">
        {liveLat.toFixed(6)}, {liveLng.toFixed(6)}
        {shipmentId && ` · Tracking ${shipmentId.slice(0, 8).toUpperCase()}`}
      </p>
    </div>
  );
}

export default function ShipperLoadTrackingPage() {
  const { loadId } = useParams();

  const { data: load, isLoading: loadLoading } = useQuery({
    queryKey: ["shipper-load-track", loadId],
    queryFn: () => shipperApi.getLoad(loadId),
    refetchInterval: 30_000,
  });

  const { data: shipment } = useQuery({
    queryKey: ["shipper-shipment-by-load", loadId],
    queryFn: () => shipperApi.getShipmentByLoad(loadId),
    enabled: Boolean(load && ["booked", "en_route_pickup", "loaded", "in_transit", "delivered"].includes(load.status)),
    refetchInterval: 15_000,
    retry: false,
  });

  if (loadLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!load) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        Load not found.
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === load.status);
  const currentStep = STATUS_STEPS[currentIdx];
  const dotColor = STATUS_COLORS[load.status] || "bg-slate-400";
  const isInTransit = load.status === "in_transit";

  const lat = shipment?.current_latitude;
  const lng = shipment?.current_longitude;
  const hasLocation = lat != null && lng != null;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Back */}
      <div className="mb-5">
        <Link to="/shipper/tracking"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Tracking
        </Link>
      </div>

      {/* Load ID + route */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <span className="font-mono text-xs font-bold text-primary tracking-wide block">
              TRK-{load.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {load.cargo_type} · {load.weight_tonnes}t
              {load.distance_km ? ` · ${load.distance_km.toLocaleString()} km` : ""}
            </span>
          </div>
          <span className="font-mono font-bold text-secondary text-sm">{formatKES(load.price_kes)}</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pickup</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{load.pickup_location}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Dropoff</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{load.dropoff_location}</p>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <h2 className="font-heading font-semibold text-slate-800 text-sm mb-5">Journey Progress</h2>

        {/* Step dots */}
        <div className="relative flex items-start justify-between mb-5">
          {/* connector line */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 z-0" />
          <div
            className="absolute top-3 left-0 h-0.5 z-0 bg-secondary transition-all duration-500"
            style={{ width: currentIdx < 0 ? "0%" : `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          {STATUS_STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  done || active
                    ? `${dotColor} border-transparent`
                    : "bg-white border-slate-200"
                } ${active ? "ring-4 ring-secondary/20 scale-110" : ""}`}>
                  {done && <span className="text-white text-[10px]">✓</span>}
                  {active && <span className={`w-2 h-2 rounded-full bg-white ${isInTransit ? "animate-pulse" : ""}`} />}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 text-center leading-tight ${
                  active ? "text-slate-900" : done ? "text-secondary" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current status message */}
        {currentStep && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            isInTransit ? "bg-teal-50 border border-teal-200" : "bg-slate-50 border border-slate-200"
          }`}>
            {isInTransit
              ? <span className="w-2.5 h-2.5 rounded-full bg-[#4fdbcc] animate-pulse shrink-0" />
              : <Navigation2 className={`w-4 h-4 shrink-0 ${dotColor.replace("bg-", "text-")}`} />}
            <div>
              <p className="text-sm font-semibold text-slate-800">{currentStep.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{currentStep.desc}</p>
            </div>
            {shipment?.eta && (
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">ETA</p>
                <p className="text-xs font-semibold text-slate-700">
                  {new Date(shipment.eta).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map — only when in_transit with a known location */}
      {isInTransit && hasLocation ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <ResizableMap lat={lat} lng={lng} shipmentId={shipment?.id} />
        </div>
      ) : isInTransit && !hasLocation ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-5 text-center">
          <Navigation2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Waiting for driver to share location…</p>
          <p className="text-xs text-slate-400 mt-1">Location updates every 30 seconds</p>
        </div>
      ) : null}

      {/* Shipment details */}
      {shipment && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-heading font-semibold text-slate-800 text-sm mb-4">Shipment Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Escrow", value: shipment.escrow_locked ? "Locked" : "Pending", ok: shipment.escrow_locked },
              { label: "Payment", value: shipment.escrow_released ? "Released" : "Held", ok: shipment.escrow_released },
              { label: "Dispute", value: shipment.dispute_open ? "Open" : "None", ok: !shipment.dispute_open },
            ].map(({ label, value, ok }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-semibold ${ok ? "text-teal-600" : "text-slate-600"}`}>{value}</p>
              </div>
            ))}
          </div>
          {load.pickup_date && (
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Scheduled pickup: {load.pickup_date}{load.pickup_window ? ` · ${load.pickup_window}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
