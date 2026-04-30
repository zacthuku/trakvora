import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Truck, Plus, Edit2, X, Search, Gauge, Calendar,
  MapPin, Activity, ToggleLeft, ToggleRight, ChevronDown,
  Layers, AlertCircle, CheckCircle2, Wifi, WifiOff,
  UserCheck, UserX, User, ExternalLink,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { driverApi } from "@/features/driver/api/driverApi";
import { formatKES } from "@/utils/currency";

const TRUCK_TYPES = [
  { value: "flatbed", label: "Flatbed" },
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer",  label: "Reefer"  },
  { value: "tanker",  label: "Tanker"  },
  { value: "lowbed",  label: "Lowbed"  },
  { value: "tipper",  label: "Tipper"  },
];

const TYPE_COLORS = {
  flatbed: "bg-sky-50 text-sky-700 border-sky-200",
  dry_van: "bg-violet-50 text-violet-700 border-violet-200",
  reefer:  "bg-teal-50 text-teal-700 border-teal-200",
  tanker:  "bg-blue-50 text-blue-700 border-blue-200",
  lowbed:  "bg-amber-50 text-amber-700 border-amber-200",
  tipper:  "bg-orange-50 text-orange-700 border-orange-200",
};

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors bg-white text-slate-800 placeholder:text-slate-400";

// ── Truck Edit/Create Modal ────────────────────────────────────────────────────
function TruckModal({ truck, onClose }) {
  const qc = useQueryClient();
  const isEdit = Boolean(truck?.id);

  const [form, setForm] = useState({
    registration_number: truck?.registration_number || "",
    truck_type:          truck?.truck_type || "flatbed",
    capacity_tonnes:     truck?.capacity_tonnes || "",
    make:                truck?.make || "",
    model:               truck?.model || "",
    year:                truck?.year || "",
    gps_tracker_id:      truck?.gps_tracker_id || "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? apiClient.patch(`/trucks/${truck.id}`, data).then((r) => r.data)
        : apiClient.post("/trucks", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner-trucks"] }); onClose(); },
    onError: (err) => setError(err?.response?.data?.detail || "Failed to save truck"),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate({
      ...form,
      capacity_tonnes: parseFloat(form.capacity_tonnes),
      year:            form.year ? parseInt(form.year, 10) : null,
      gps_tracker_id:  form.gps_tracker_id || null,
      make:            form.make || null,
      model:           form.model || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="font-heading font-bold text-slate-900 text-lg">
              {isEdit ? "Edit Truck Details" : "Register New Truck"}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEdit ? "Update your fleet unit's information." : "Add a new unit to your fleet registry."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Registration No. *
              </label>
              <input
                value={form.registration_number} onChange={set("registration_number")}
                required disabled={isEdit} placeholder="KAA 123B"
                className={`${inputCls} ${isEdit ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Truck Type *
              </label>
              <select value={form.truck_type} onChange={set("truck_type")} className={inputCls}>
                {TRUCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Capacity (Tonnes) *
            </label>
            <input
              type="number" step="0.5" min="0.5" max="100"
              value={form.capacity_tonnes} onChange={set("capacity_tonnes")} required
              placeholder="e.g. 30" className={inputCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Make</label>
              <input value={form.make} onChange={set("make")} placeholder="Isuzu" className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Model</label>
              <input value={form.model} onChange={set("model")} placeholder="NQR" className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Year</label>
              <input
                type="number" min="1990" max="2030"
                value={form.year} onChange={set("year")} placeholder="2022" className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              GPS Tracker ID
            </label>
            <input
              value={form.gps_tracker_id} onChange={set("gps_tracker_id")}
              placeholder="TRK-GPS-001 (optional)" className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">Used for live telemetry on the dashboard map.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {mutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <>{isEdit ? "Save Changes" : "Register Truck"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assign Driver Modal ────────────────────────────────────────────────────────
function AssignDriverModal({ truck, onClose }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState("");

  const { data: availableDrivers = [], isLoading } = useQuery({
    queryKey: ["available-drivers"],
    queryFn: driverApi.getAvailableDrivers,
  });

  const mutation = useMutation({
    mutationFn: (driverUserId) =>
      apiClient
        .patch(`/trucks/${truck.id}/assign-driver`, { driver_user_id: driverUserId })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-trucks"] });
      onClose();
    },
    onError: (err) => setError(err?.response?.data?.detail || "Failed to assign driver"),
  });

  const filtered = availableDrivers.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (d.full_name || "").toLowerCase().includes(q) ||
      (d.licence_class || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="font-heading font-bold text-slate-900 text-lg">Assign Driver</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Truck <span className="font-mono font-semibold">{truck.registration_number}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or licence class…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-slate-400 py-8 text-sm">Loading drivers…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              {availableDrivers.length === 0
                ? "No available drivers found"
                : "No drivers match your search"}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((driver) => {
                const isSelected = selectedUserId === driver.user_id;
                return (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedUserId(isSelected ? null : driver.user_id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-secondary bg-orange-50"
                        : "border-slate-200 bg-white hover:border-secondary/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <span className="text-xs font-bold text-slate-600 font-heading">
                        {(driver.full_name || "D").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{driver.full_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">
                        {driver.licence_class && `Class ${driver.licence_class}`}
                        {driver.experience_years && ` · ${driver.experience_years}y exp`}
                        {driver.ntsa_verified && (
                          <span className="ml-1 text-emerald-600 font-medium">· NTSA ✓</span>
                        )}
                      </p>
                    </div>
                    {driver.seeking_employment && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider shrink-0">
                        Seeking
                      </span>
                    )}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 pt-2 border-t border-slate-100">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            disabled={!selectedUserId || mutation.isPending}
            onClick={() => mutation.mutate(selectedUserId)}
            className="flex-1 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Assigning…</>
            ) : (
              <><UserCheck className="w-4 h-4" /> Assign Driver</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Truck Card ─────────────────────────────────────────────────────────────────
function TruckCard({ truck, onEdit, onAssign }) {
  const qc = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/trucks/${truck.id}`, { is_active: !truck.is_active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-trucks"] }),
  });

  const unassignMutation = useMutation({
    mutationFn: () =>
      apiClient
        .patch(`/trucks/${truck.id}/assign-driver`, { driver_user_id: null })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-trucks"] }),
  });

  const { data: assignedDriver } = useQuery({
    queryKey: ["driver-by-id", truck.assigned_driver_id],
    queryFn: () => apiClient.get(`/drivers/${truck.assigned_driver_id}`).then((r) => r.data),
    enabled: Boolean(truck.assigned_driver_id),
    staleTime: 60_000,
  });

  const hasGps      = Boolean(truck.gps_tracker_id);
  const hasLocation = Boolean(truck.current_latitude && truck.current_longitude);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`h-[3px] w-full ${truck.is_active ? "bg-[#4fdbcc]" : "bg-slate-200"}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-base tracking-wide">
                {truck.registration_number}
              </span>
              {truck.is_active ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider border border-teal-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbcc] animate-pulse" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Idle
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {truck.make && truck.model
                ? `${truck.make} ${truck.model}${truck.year ? ` · ${truck.year}` : ""}`
                : "Details not set"}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize ${TYPE_COLORS[truck.truck_type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {truck.truck_type.replace("_", " ")}
          </span>
        </div>

        {/* Assigned driver banner */}
        {truck.assigned_driver_id ? (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-800 truncate">
                {assignedDriver?.full_name || "Assigned Driver"}
              </p>
              <p className="text-[10px] text-emerald-600">
                {assignedDriver?.licence_class ? `Class ${assignedDriver.licence_class}` : "Driver assigned"}
                {assignedDriver?.ntsa_verified && " · NTSA ✓"}
              </p>
            </div>
            {assignedDriver?.user_id && (
              <Link
                to={`/driver-profile/${assignedDriver.user_id}`}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
                title="View driver profile"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </Link>
            )}
            <button
              onClick={() => unassignMutation.mutate()}
              disabled={unassignMutation.isPending}
              className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
              title="Unassign driver"
            >
              <UserX className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAssign(truck)}
            className="w-full flex items-center justify-center gap-1.5 mb-4 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:border-secondary hover:text-secondary hover:bg-orange-50 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" /> Assign Driver
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-slate-50 rounded-lg py-2.5 px-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Capacity</p>
            <p className="font-heading font-bold text-slate-900 text-base">{truck.capacity_tonnes}t</p>
          </div>
          <div className="text-center bg-slate-50 rounded-lg py-2.5 px-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">GPS</p>
            <div className="flex items-center justify-center gap-1">
              {hasGps ? (
                <><Wifi className="w-3.5 h-3.5 text-teal-500" /><p className="font-semibold text-teal-700 text-xs">Active</p></>
              ) : (
                <><WifiOff className="w-3.5 h-3.5 text-slate-400" /><p className="font-semibold text-slate-400 text-xs">None</p></>
              )}
            </div>
          </div>
          <div className="text-center bg-slate-50 rounded-lg py-2.5 px-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
            <div className="flex items-center justify-center gap-1">
              {hasLocation ? (
                <><MapPin className="w-3.5 h-3.5 text-[#4fdbcc]" /><p className="font-semibold text-slate-700 text-xs">Live</p></>
              ) : (
                <><MapPin className="w-3.5 h-3.5 text-slate-400" /><p className="font-semibold text-slate-400 text-xs">—</p></>
              )}
            </div>
          </div>
        </div>

        {truck.gps_tracker_id && (
          <div className="flex items-center gap-1.5 mb-4 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-mono">{truck.gps_tracker_id}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button onClick={() => onEdit(truck)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              truck.is_active
                ? "border border-orange-200 text-secondary hover:bg-orange-50"
                : "border border-teal-200 text-teal-700 hover:bg-teal-50"
            }`}
          >
            {truck.is_active ? (
              <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</>
            ) : (
              <><ToggleLeft className="w-3.5 h-3.5" /> Activate</>
            )}
          </button>
          <span className="ml-auto text-[10px] text-slate-400 font-mono">
            {new Date(truck.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function FleetManagementPage() {
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal]             = useState(null); // null | "add" | truck object
  const [assignModal, setAssignModal] = useState(null); // null | truck object

  const { data: trucks = [], isLoading } = useQuery({
    queryKey: ["owner-trucks"],
    queryFn: () => apiClient.get("/trucks").then((r) => r.data),
  });

  const filtered = useMemo(() => {
    return trucks.filter((t) => {
      const matchSearch =
        !search ||
        t.registration_number.toLowerCase().includes(search.toLowerCase()) ||
        (t.make || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.model || "").toLowerCase().includes(search.toLowerCase());
      const matchType   = !filterType   || t.truck_type === filterType;
      const matchStatus = !filterStatus || (filterStatus === "active" ? t.is_active : !t.is_active);
      return matchSearch && matchType && matchStatus;
    });
  }, [trucks, search, filterType, filterStatus]);

  const totalCapacity  = trucks.reduce((sum, t) => sum + t.capacity_tonnes, 0);
  const activeCount    = trucks.filter((t) => t.is_active).length;
  const gpsCount       = trucks.filter((t) => t.gps_tracker_id).length;
  const assignedCount  = trucks.filter((t) => t.assigned_driver_id).length;

  const selectCls =
    "pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 appearance-none";

  return (
    <div className="w-full">
      {modal !== null && (
        <TruckModal truck={modal === "add" ? null : modal} onClose={() => setModal(null)} />
      )}
      {assignModal !== null && (
        <AssignDriverModal truck={assignModal} onClose={() => setAssignModal(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Fleet Management</h1>
          <p className="text-slate-500 text-sm mt-1">Register, configure and monitor every unit in your fleet.</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(254,106,52,0.25)]"
        >
          <Plus className="w-4 h-4" /> Register Truck
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Units",     value: trucks.length,                              color: "text-slate-900",         sub: "registered"         },
          { label: "Active",          value: activeCount,                                color: "text-[#4fdbcc]",          sub: "in service"          },
          { label: "Drivers Assigned",value: assignedCount,                              color: "text-primary",           sub: `${trucks.length - assignedCount} unassigned` },
          { label: "Total Capacity",  value: `${totalCapacity.toLocaleString()}t`,       color: "text-secondary",         sub: `${gpsCount} GPS-enabled` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-heading font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-5 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate, make, model…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="relative">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
            <option value="">All Types</option>
            {TRUCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filtered.length} unit{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Truck grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center shadow-sm">
          <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {trucks.length === 0 ? "No trucks registered yet." : "No trucks match your filters."}
          </p>
          {trucks.length === 0 && (
            <button onClick={() => setModal("add")}
              className="mt-4 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Register your first truck
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              onEdit={(t) => setModal(t)}
              onAssign={(t) => setAssignModal(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
