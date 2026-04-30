import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, MapPin, Ruler, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { shipperApi } from "@/features/shipper/api/shipperApi";
import LocationSearch from "@/components/ui/LocationSearch";
import { CARGO_TYPES, TRUCK_TYPES } from "@/utils/constants";

// ─── Haversine distance (km, straight-line) ───────────────────────────────────
function straightLineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road distance ≈ straight-line × 1.3 (typical East Africa factor)
function roadKm(lat1, lng1, lat2, lng2) {
  return Math.round(straightLineKm(lat1, lng1, lat2, lng2) * 1.3);
}

// Estimate delivery given road km and pickup datetime string "YYYY-MM-DD HH:MM"
function estimateDelivery(distKm, pickupDate, pickupWindow) {
  if (!pickupDate || !pickupWindow || !distKm) return null;
  const startHour = parseInt(pickupWindow.split(":")[0], 10);
  const base = new Date(`${pickupDate}T${String(startHour).padStart(2, "0")}:00:00`);
  if (isNaN(base.getTime())) return null;
  // avg loaded truck 60 km/h + 2 h buffer
  const totalHours = distKm / 60 + 2;
  const delivery = new Date(base.getTime() + totalHours * 3600 * 1000);
  return delivery;
}

function formatDelivery(dt) {
  if (!dt) return null;
  return dt.toLocaleString("en-KE", {
    weekday: "long", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const TIME_WINDOWS = [
  { value: "06:00", label: "06:00 – 09:00  (Early Morning)" },
  { value: "09:00", label: "09:00 – 12:00  (Morning)" },
  { value: "12:00", label: "12:00 – 15:00  (Midday)" },
  { value: "15:00", label: "15:00 – 18:00  (Afternoon)" },
  { value: "18:00", label: "18:00 – 21:00  (Evening)" },
];

const INITIAL_LOC = { name: "", lat: null, lng: null };

const INITIAL = {
  pickup: INITIAL_LOC,
  dropoff: INITIAL_LOC,
  pickup_date: "",
  pickup_window: "09:00",
  cargo_type: "general",
  weight_tonnes: "",
  required_truck_type: "",
  cargo_description: "",
  requires_insurance: false,
  booking_mode: "fixed",
  price_kes: "",
  special_instructions: "",
};

const STEPS = ["Route & Schedule", "Cargo", "Pricing"];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = current === n;
        const done = current > n;
        return (
          <div key={n} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done || active ? "bg-secondary text-white" : "bg-slate-200 text-slate-500"}`}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span className={`text-sm font-medium hidden sm:block transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}>
              {label}
            </span>
            {n < STEPS.length && <div className={`h-0.5 w-8 transition-colors ${done ? "bg-secondary" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function PostLoadPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [step, setStep] = useState(1);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const bothLocated = form.pickup.lat != null && form.dropoff.lat != null;
  const distance = bothLocated
    ? roadKm(form.pickup.lat, form.pickup.lng, form.dropoff.lat, form.dropoff.lng)
    : null;

  const deliveryDt = estimateDelivery(distance, form.pickup_date, form.pickup_window);
  const deliveryLabel = formatDelivery(deliveryDt);

  const today = new Date().toISOString().split("T")[0];

  const mutation = useMutation({
    mutationFn: shipperApi.createLoad,
    onSuccess: () => navigate("/shipper"),
    onError: (err) => alert(err.response?.data?.detail || "Failed to post load"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const windowLabel = TIME_WINDOWS.find((w) => w.value === form.pickup_window)?.label || form.pickup_window;
    mutation.mutate({
      pickup_location: form.pickup.name,
      pickup_latitude: form.pickup.lat,
      pickup_longitude: form.pickup.lng,
      dropoff_location: form.dropoff.name,
      dropoff_latitude: form.dropoff.lat,
      dropoff_longitude: form.dropoff.lng,
      distance_km: distance,
      cargo_type: form.cargo_type,
      weight_tonnes: parseFloat(form.weight_tonnes),
      required_truck_type: form.required_truck_type || null,
      cargo_description: form.cargo_description || null,
      requires_insurance: form.requires_insurance,
      booking_mode: form.booking_mode,
      price_kes: parseFloat(form.price_kes),
      special_instructions: form.special_instructions || null,
      pickup_date: form.pickup_date || null,
      pickup_window: form.pickup_window || null,
      pickup_deadline: form.pickup_date ? `${form.pickup_date} ${windowLabel}` : null,
    });
  };

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow";
  const selectCls = inputCls;

  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Post a Load</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the route, cargo details and pricing.</p>
      </header>

      <StepBar current={step} />

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: Route & Schedule ── */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
            <h2 className="font-heading font-semibold text-slate-800 text-base">Route Details</h2>

            <LocationSearch
              label="Pickup Location"
              value={form.pickup}
              onChange={(loc) => set("pickup", loc)}
            />

            <LocationSearch
              label="Dropoff Location"
              value={form.dropoff}
              onChange={(loc) => set("dropoff", loc)}
            />

            {/* Distance badge */}
            {distance != null && (
              <div className="flex items-center gap-3 bg-secondary/5 border border-secondary/20 rounded-lg px-4 py-3">
                <Ruler className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Estimated road distance: <span className="text-secondary">{distance.toLocaleString()} km</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Based on straight-line × 1.3 road factor</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h3 className="font-heading font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-secondary" />
                Pickup Schedule
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Pickup Date">
                  <input
                    type="date"
                    min={today}
                    value={form.pickup_date}
                    onChange={(e) => set("pickup_date", e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Pickup Time Window">
                  <select
                    value={form.pickup_window}
                    onChange={(e) => set("pickup_window", e.target.value)}
                    className={selectCls}
                  >
                    {TIME_WINDOWS.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Estimated delivery preview */}
              {deliveryLabel && (
                <div className="mt-3 flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <Clock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-green-800">Estimated delivery</p>
                    <p className="text-sm text-green-700 font-medium mt-0.5">{deliveryLabel}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      ~{Math.round(distance / 60 + 2)}h transit · avg 60 km/h + 2h loading buffer
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={!bothLocated}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-secondary text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Cargo ── */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
            <h2 className="font-heading font-semibold text-slate-800 text-base">Cargo Details</h2>

            <Field label="Cargo Type">
              <select value={form.cargo_type} onChange={(e) => set("cargo_type", e.target.value)} className={selectCls}>
                {CARGO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            <Field label="Weight (tonnes)">
              <input type="number" step="0.1" min="0.1" required value={form.weight_tonnes}
                onChange={(e) => set("weight_tonnes", e.target.value)}
                className={inputCls} placeholder="e.g. 10.5" />
            </Field>

            <Field label="Required Truck Type (optional)">
              <select value={form.required_truck_type} onChange={(e) => set("required_truck_type", e.target.value)} className={selectCls}>
                <option value="">Any</option>
                {TRUCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            <Field label="Cargo Description (optional)">
              <textarea rows={3} value={form.cargo_description}
                onChange={(e) => set("cargo_description", e.target.value)}
                placeholder="Briefly describe the goods…"
                className={inputCls + " resize-none"} />
            </Field>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.requires_insurance}
                onChange={(e) => set("requires_insurance", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary accent-secondary" />
              <span className="text-slate-700">Requires cargo insurance</span>
            </label>

            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-2 border border-slate-300 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" disabled={!form.weight_tonnes} onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-secondary text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Pricing + Summary ── */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
            <h2 className="font-heading font-semibold text-slate-800 text-base">Pricing</h2>

            <Field label="Booking Mode">
              <select value={form.booking_mode} onChange={(e) => set("booking_mode", e.target.value)} className={selectCls}>
                <option value="fixed">Fixed Price</option>
                <option value="auction">Auction — accept bids</option>
              </select>
            </Field>

            <Field label={form.booking_mode === "auction" ? "Minimum Bid (KES)" : "Price (KES)"}>
              <input type="number" min="1" required value={form.price_kes}
                onChange={(e) => set("price_kes", e.target.value)}
                className={inputCls} placeholder="e.g. 45000" />
            </Field>

            <Field label="Special Instructions (optional)">
              <textarea rows={2} value={form.special_instructions}
                onChange={(e) => set("special_instructions", e.target.value)}
                placeholder="Gate code, fragile items, loading dock access…"
                className={inputCls + " resize-none"} />
            </Field>

            {/* ── Route + Schedule summary card ── */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Load Summary</p>
              </div>
              <div className="p-4 space-y-3">
                {/* Route */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <div className="w-0.5 h-6 bg-slate-300" />
                    <MapPin className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2.5 flex-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{form.pickup.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {form.pickup.lat?.toFixed(5)}, {form.pickup.lng?.toFixed(5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{form.dropoff.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {form.dropoff.lat?.toFixed(5)}, {form.dropoff.lng?.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Ruler className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span><span className="font-semibold">{distance?.toLocaleString() ?? "—"} km</span> road distance</span>
                  </div>
                  {deliveryLabel && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span className="truncate">{deliveryLabel}</span>
                    </div>
                  )}
                  {form.pickup_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CalendarDays className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span>
                        {new Date(form.pickup_date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" })}
                        {" · "}
                        {TIME_WINDOWS.find((w) => w.value === form.pickup_window)?.label.split("  ")[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep(2)}
                className="flex items-center gap-2 border border-slate-300 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={!form.price_kes || mutation.isPending}
                className="flex items-center gap-2 bg-secondary text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide">
                {mutation.isPending ? "Posting…" : "Post Load"}
                {!mutation.isPending && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
