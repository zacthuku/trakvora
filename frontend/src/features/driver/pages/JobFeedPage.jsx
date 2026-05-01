import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Filter, MapPin, RotateCcw, Navigation2, SlidersHorizontal,
  Briefcase, Building2, Star, X, Clock, Zap, ArrowRight,
  CheckCircle2, XCircle, Package,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { driverApi } from "@/features/driver/api/driverApi";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNotificationStore } from "@/store/notificationStore";
import Select from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";
import { haversineKm } from "@/utils/distance";
import { CARGO_TYPES, CORRIDORS } from "@/utils/constants";

const RADIUS_OPTIONS = [
  { value: "50",  label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "200", label: "200 km" },
  { value: "500", label: "500 km" },
];

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Direct Offer Modal ────────────────────────────────────────────────────────

function DirectOfferModal({ notification, onClose, onRespond }) {
  const [load, setLoad]     = useState(null);
  const [shipper, setShipper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(null); // "accepted" | "declined"

  useEffect(() => {
    if (!notification.reference_id) return;
    apiClient.get(`/loads/${notification.reference_id}`)
      .then(r => {
        setLoad(r.data);
        return apiClient.get(`/users/${r.data.shipper_id}/public`);
      })
      .then(r => setShipper(r.data))
      .catch(() => {});
  }, [notification.reference_id]);

  const initials = shipper?.full_name
    ? shipper.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  async function handleRespond(accept) {
    setLoading(true);
    try {
      await driverApi.respondToOffer(notification.reference_id, accept, notification.id);
      setDone(accept ? "accepted" : "declined");
      onRespond(notification.id);
    } catch {
      /* keep modal open on error */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 py-8"
      onClick={done ? onClose : undefined}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm my-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-slate-900 text-sm leading-tight">Direct Load Offer</h2>
              <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Sent directly to you</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shipper */}
        {shipper && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {shipper.profile_photo_url
                ? <img src={shipper.profile_photo_url} alt="shipper" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-slate-600 font-heading">{initials}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{shipper.full_name}</p>
              <p className="text-[10px] text-slate-400">Shipper</p>
              {shipper.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="text-[10px] text-slate-500">{shipper.rating.toFixed(1)} · {shipper.total_trips} trips</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Load details */}
        {load && (
          <div className="px-6 py-5 space-y-4">
            {/* Route */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
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

            {/* Details row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span className="capitalize">{load.cargo_type}</span>
                </span>
                <span>·</span>
                <span>{load.weight_tonnes}t</span>
                {load.distance_km && (
                  <>
                    <span>·</span>
                    <span>{load.distance_km.toLocaleString()} km</span>
                  </>
                )}
              </div>
              <span className="font-data-mono font-bold text-secondary text-base">{formatKES(load.price_kes)}</span>
            </div>

            {/* Instructions */}
            {load.special_instructions && (
              <p className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                {load.special_instructions}
              </p>
            )}

            {/* Pickup date */}
            {load.pickup_date && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Pickup: {load.pickup_date}{load.pickup_window ? ` · ${load.pickup_window}` : ""}
              </p>
            )}
          </div>
        )}

        {!load && !done && (
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Result banner */}
        {done && (
          <div className={`mx-6 mb-4 flex items-center gap-2 rounded-xl px-4 py-3 ${
            done === "accepted" ? "bg-teal-50 border border-teal-200" : "bg-slate-100 border border-slate-200"
          }`}>
            {done === "accepted"
              ? <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              : <XCircle className="w-4 h-4 text-slate-400 shrink-0" />}
            <p className="text-sm font-semibold text-slate-700">
              {done === "accepted" ? "Offer accepted — the shipper has been notified." : "Offer declined."}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-5 pt-2 border-t border-slate-100 flex items-center gap-3">
          {done ? (
            <button onClick={onClose} className="flex-1 px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Close
            </button>
          ) : (
            <>
              <button
                onClick={() => handleRespond(false)}
                disabled={loading || !load}
                className="flex-1 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleRespond(true)}
                disabled={loading || !load}
                className="flex-1 px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(254,106,52,0.3)] disabled:opacity-50"
              >
                {loading ? "..." : "Accept Offer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Direct Offer Card ──────────────────────────────────────────────────────────

function DirectOfferCard({ notification, onOpen }) {
  return (
    <div
      onClick={() => onOpen(notification)}
      className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* "Direct" pill */}
      <span className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
        <Zap className="w-2.5 h-2.5" /> Direct
      </span>

      <div className="flex items-start gap-3 pr-14">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-slate-900 text-sm leading-snug">Direct Load Offer</p>
          <p className="text-xs text-slate-600 mt-1 leading-snug line-clamp-2">{notification.body}</p>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
            <Clock className="w-3 h-3" />
            {timeAgo(notification.time)}
          </span>
        </div>
      </div>
      {!notification.read && (
        <span className="absolute top-3 left-3 w-2 h-2 bg-secondary rounded-full" />
      )}
    </div>
  );
}

// ── Driving Job Modal ─────────────────────────────────────────────────────────

function DrivingJobModal({ notification, onClose }) {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    if (!notification.reference_id) return;
    apiClient.get(`/users/${notification.reference_id}/public`)
      .then(r => setOwner(r.data))
      .catch(() => {});
  }, [notification.reference_id]);

  const initials = owner?.full_name
    ? owner.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 py-8"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm my-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="font-heading font-bold text-slate-900 text-sm leading-tight max-w-[200px]">
              {notification.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Posted by */}
        {owner && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {owner.profile_photo_url
                ? <img src={owner.profile_photo_url} alt="owner" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-slate-600 font-heading">{initials}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{owner.full_name}</p>
              {owner.company_name && (
                <p className="text-[10px] text-slate-400 truncate">{owner.company_name}</p>
              )}
              {owner.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="text-[10px] text-slate-500">{owner.rating.toFixed(1)} · {owner.total_trips} trips</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{notification.body}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{timeAgo(notification.time)}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(254,106,52,0.3)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Driving Job Card ──────────────────────────────────────────────────────────

function DrivingJobCard({ notification, onOpen }) {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    if (!notification.reference_id) return;
    apiClient.get(`/users/${notification.reference_id}/public`)
      .then(r => setOwner(r.data))
      .catch(() => {});
  }, [notification.reference_id]);

  const initials = owner?.full_name
    ? owner.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div
      onClick={() => onOpen(notification)}
      className="card-accent p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase className="w-5 h-5 text-secondary" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-heading font-bold text-slate-900 text-sm leading-snug">{notification.title}</p>

          {/* Body preview */}
          <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">{notification.body}</p>

          {/* Owner row */}
          {owner && (
            <div className="flex items-center gap-2 mt-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {owner.profile_photo_url
                  ? <img src={owner.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[9px] font-bold text-slate-600">{initials}</span>}
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{owner.full_name}</span>
                {owner.company_name && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5 text-[11px] text-slate-400 truncate">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {owner.company_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time */}
        <div className="text-right shrink-0">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            {timeAgo(notification.time)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobFeedPage() {
  const { position } = useGeolocation();
  const [activeTab, setActiveTab]           = useState("cargo");
  const [cargoFilter, setCargoFilter]       = useState("");
  const [corridorFilter, setCorridorFilter] = useState("");
  const [selectedJob, setSelectedJob]       = useState(null);

  // Return-trip mode
  const [returnMode, setReturnMode]       = useState(false);
  const [returnLat, setReturnLat]         = useState("");
  const [returnLon, setReturnLon]         = useState("");
  const [radiusKm, setRadiusKm]           = useState("100");
  const [useCurrentPos, setUseCurrentPos] = useState(false);

  const { notifications, markRead } = useNotificationStore();
  const directOffers   = notifications.filter(n => n.type === "direct_offer");
  const drivingJobs    = notifications.filter(n => n.reference_type === "job_post");
  const unreadJobCount = [
    ...directOffers.filter(n => !n.read),
    ...drivingJobs.filter(n => !n.read),
  ].length;
  const [selectedOffer, setSelectedOffer] = useState(null);

  const effectiveReturnLat = returnMode
    ? useCurrentPos && position ? position.latitude  : parseFloat(returnLat) || undefined
    : undefined;
  const effectiveReturnLon = returnMode
    ? useCurrentPos && position ? position.longitude : parseFloat(returnLon) || undefined
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["jobs-feed", cargoFilter, corridorFilter, effectiveReturnLat, effectiveReturnLon, radiusKm],
    queryFn: () =>
      driverApi.getMarketplace({
        cargo_type: cargoFilter  || undefined,
        corridor:   corridorFilter || undefined,
        near_lat:   effectiveReturnLat,
        near_lon:   effectiveReturnLon,
        radius_km:  returnMode ? parseFloat(radiusKm) : undefined,
        page:       1,
        page_size:  50,
      }),
    enabled: activeTab === "cargo",
  });

  if (isLoading && activeTab === "cargo") return <PageSpinner />;

  let loads = data?.items || [];
  if (!returnMode && position) {
    loads = [...loads].sort((a, b) => {
      const da     = haversineKm(position.latitude, position.longitude, a.pickup_latitude,  a.pickup_longitude);
      const db     = haversineKm(position.latitude, position.longitude, b.pickup_latitude,  b.pickup_longitude);
      const profitA = a.price_kes / (da + 1);
      const profitB = b.price_kes / (db + 1);
      return profitB - profitA;
    });
  }

  const distanceRef = effectiveReturnLat != null && effectiveReturnLon != null
    ? { lat: effectiveReturnLat, lon: effectiveReturnLon }
    : position
    ? { lat: position.latitude, lon: position.longitude }
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Job Feed</h1>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("cargo")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "cargo"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Cargo Loads
          </button>
          <button
            onClick={() => setActiveTab("driving")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "driving"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Driving Jobs
            {unreadJobCount > 0 && (
              <span className="min-w-[16px] h-4 bg-secondary rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
                {unreadJobCount > 9 ? "9+" : unreadJobCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Cargo Loads Tab ────────────────────────────────────────────────── */}
      {activeTab === "cargo" && (
        <>
          {/* Return-trip controls */}
          <div className="flex items-center justify-between mb-4">
            {returnMode && (
              <p className="text-xs text-sky-600 font-medium flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Return Trip Mode — loads near your drop-off
              </p>
            )}
            <button
              onClick={() => setReturnMode((v) => !v)}
              className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                returnMode
                  ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-700"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return Trip
            </button>
          </div>

          {/* Return-trip panel */}
          {returnMode && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-sky-800">Find loads near your drop-off</p>
                <button
                  onClick={() => setUseCurrentPos((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    useCurrentPos
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-sky-700 border-sky-300 hover:bg-sky-100"
                  }`}
                >
                  <Navigation2 className="w-3 h-3" />
                  {useCurrentPos ? "Using GPS" : "Use My Location"}
                </button>
              </div>

              {!useCurrentPos && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wider mb-1">Latitude</label>
                    <input
                      type="number" step="0.0001" placeholder="-1.2921"
                      value={returnLat} onChange={(e) => setReturnLat(e.target.value)}
                      className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wider mb-1">Longitude</label>
                    <input
                      type="number" step="0.0001" placeholder="36.8219"
                      value={returnLon} onChange={(e) => setReturnLon(e.target.value)}
                      className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <label className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider shrink-0">Radius</label>
                <div className="flex gap-1.5">
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRadiusKm(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                        radiusKm === opt.value
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white text-sky-700 border-sky-300 hover:bg-sky-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select
              options={[{ value: "", label: "All cargo" }, ...CARGO_TYPES]}
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="text-sm"
            />
            <Select
              options={[{ value: "", label: "All corridors" }, ...CORRIDORS.map((c) => ({ value: c, label: c }))]}
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="text-sm"
            />
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {loads.length} load{loads.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Cargo results */}
          {loads.length === 0 ? (
            <div className="card p-12 text-center">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No loads match your filters</p>
              {returnMode && (
                <p className="text-xs text-slate-400 mt-1">
                  Try increasing the radius or check your drop-off coordinates
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {loads.map((load) => {
                const distKm = distanceRef
                  ? Math.round(haversineKm(distanceRef.lat, distanceRef.lon, load.pickup_latitude, load.pickup_longitude))
                  : null;
                return (
                  <div key={load.id} className="card-accent p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">{load.pickup_location}</div>
                        <div className="w-0.5 h-3 bg-slate-300 mx-1 my-0.5" />
                        <div className="font-semibold text-slate-900 text-sm">{load.dropoff_location}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                          <span>{load.weight_tonnes}t</span>
                          <span>·</span>
                          <span className="capitalize">{load.cargo_type}</span>
                          {load.corridor && <><span>·</span><span>{load.corridor}</span></>}
                          {distKm !== null && (
                            <>
                              <span>·</span>
                              <span className={`flex items-center gap-0.5 ${returnMode ? "text-sky-600 font-semibold" : ""}`}>
                                <MapPin className="w-3 h-3" />
                                {distKm} km {returnMode ? "from drop-off" : "away"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="font-data-mono font-bold text-lg text-slate-900">{formatKES(load.price_kes)}</div>
                        <StatusBadge status={load.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Driving Jobs Tab ───────────────────────────────────────────────── */}
      {activeTab === "driving" && (
        <>
          {/* Direct offers — shown first when present */}
          {directOffers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-slate-900 text-sm">Direct Offers</h3>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {directOffers.length}
                </span>
                <p className="ml-auto text-xs text-slate-400">Sent specifically to you</p>
              </div>
              <div className="flex flex-col gap-3">
                {directOffers.map((n) => (
                  <DirectOfferCard
                    key={n.id}
                    notification={n}
                    onOpen={(notif) => { markRead(notif.id); setSelectedOffer(notif); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Broadcast job posts */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <h3 className="font-heading font-bold text-slate-900 text-sm">Job Board</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {drivingJobs.length} post{drivingJobs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {drivingJobs.length === 0 && directOffers.length === 0 ? (
            <div className="card p-12 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No driving jobs yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Fleet owners will post job opportunities here when they need drivers
              </p>
            </div>
          ) : drivingJobs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-slate-400">No broadcast job posts yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {drivingJobs.map((n) => (
                <DrivingJobCard
                  key={n.id}
                  notification={n}
                  onOpen={(notif) => { markRead(notif.id); setSelectedJob(notif); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Driving job detail modal — portalled to body to escape layout stacking context */}
      {selectedJob && createPortal(
        <DrivingJobModal notification={selectedJob} onClose={() => setSelectedJob(null)} />,
        document.body,
      )}

      {/* Direct offer modal */}
      {selectedOffer && createPortal(
        <DirectOfferModal
          notification={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onRespond={(id) => markRead(id)}
        />,
        document.body,
      )}
    </div>
  );
}
