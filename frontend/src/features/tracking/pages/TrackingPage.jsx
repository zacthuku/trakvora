import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navigation, Wifi, WifiOff } from "lucide-react";
import apiClient from "@/services/apiClient";
import { useTrackingSocket } from "@/hooks/useWebSocket";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";

export default function TrackingPage() {
  const { shipmentId } = useParams();
  const { lastMessage, connected } = useTrackingSocket(shipmentId);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment-track", shipmentId],
    queryFn: () => apiClient.get(`/shipments/${shipmentId}`).then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <PageSpinner />;
  if (!shipment) return <div className="p-8 text-slate-500">Shipment not found</div>;

  const lat = lastMessage?.latitude ?? shipment.current_latitude;
  const lng = lastMessage?.longitude ?? shipment.current_longitude;

  const STATUS_STEPS = [
    { key: "booked", label: "Booked" },
    { key: "en_route_pickup", label: "En Route" },
    { key: "loaded", label: "Loaded" },
    { key: "in_transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
  ];
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === shipment.status);

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">
              Live Tracking
            </h1>
            <div className="data-id mt-1">{shipmentId}</div>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-teal-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm text-slate-500">
              {connected ? "Live" : "Polling"}
            </span>
            <StatusBadge status={shipment.status} />
          </div>
        </div>

        <div className="card-accent p-6 mb-6">
          <h2 className="font-heading font-semibold mb-4">Journey Progress</h2>
          <div className="flex items-center gap-2 overflow-x-auto">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`status-timeline-dot ${
                      idx <= currentIdx
                        ? "border-secondary bg-secondary"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                  <span className="text-xs text-slate-500 mt-1">{step.label}</span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mb-4 ${
                      idx < currentIdx ? "bg-secondary" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {lat && lng ? (
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-secondary" />
              <h2 className="font-heading font-semibold">Current Location</h2>
            </div>
            <div className="font-data-mono text-sm text-slate-700">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
            {shipment.eta && (
              <div className="mt-2 text-sm text-slate-500">
                ETA: {new Date(shipment.eta).toLocaleString()}
              </div>
            )}
            <div className="mt-4 bg-slate-100 rounded-lg h-48 flex items-center justify-center text-slate-400 text-sm">
              Map — install react-leaflet and wire MapContainer here
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-500">
            <Navigation className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Waiting for driver location update…
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-xs text-slate-500 mb-1">Driver</div>
            <div className="data-id">{shipment.driver_id?.slice(0, 8)}…</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-slate-500 mb-1">Dispute</div>
            <div className={`text-sm font-medium ${shipment.dispute_open ? "text-red-600" : "text-teal-600"}`}>
              {shipment.dispute_open ? "Open" : "None"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
