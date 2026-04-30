import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, Star, BadgeCheck, MapPin, Truck,
  Send, UserMinus, UserPlus, Briefcase, X, CheckCircle2,
  AlertCircle, Clock, Wifi, WifiOff, ChevronDown, ChevronUp,
} from "lucide-react";
import apiClient from "@/services/apiClient";

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors bg-white text-slate-800 placeholder:text-slate-400";

const AVAIL_META = {
  available: { label: "Available", dot: "bg-teal-400", text: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
  on_job:    { label: "On Job",    dot: "bg-sky-400",  text: "text-sky-700",  bg: "bg-sky-50 border-sky-200"   },
  offline:   { label: "Offline",   dot: "bg-slate-400",text: "text-slate-500",bg: "bg-slate-100 border-slate-200" },
};

const TRUCK_TYPES = ["flatbed", "dry_van", "reefer", "tanker", "lowbed", "tipper"];

function Avatar({ name, photo, size = 10 }) {
  const initials = (name || "D").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return photo
    ? <img src={photo} alt={name} className={`w-${size} h-${size} rounded-full object-cover border border-slate-200 shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full bg-slate-800 flex items-center justify-center border border-slate-200 shrink-0`}>
        <span className="text-xs font-bold text-white font-heading">{initials}</span>
      </div>;
}

function VerBadge({ ntsa, status }) {
  if (ntsa) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200">
      <BadgeCheck className="w-3 h-3" /> NTSA
    </span>
  );
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
  return null;
}

// ── Post Job Modal ────────────────────────────────────────────────────────────
function PostJobModal({ onClose }) {
  const [form, setForm] = useState({ title: "", description: "", location: "", required_truck_type: "", salary_range: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const mut = useMutation({
    mutationFn: (data) => apiClient.post("/drivers/job-post", data),
    onSuccess: () => setDone(true),
    onError: (e) => setErr(e?.response?.data?.detail || "Failed to post job"),
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="font-heading font-bold text-slate-900 text-lg">Post a Driver Job</h2>
            <p className="text-xs text-slate-500 mt-0.5">Broadcasts to all drivers seeking employment</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7 text-teal-600" />
            </div>
            <p className="font-heading font-bold text-slate-900">Job Posted!</p>
            <p className="text-sm text-slate-500">All drivers seeking employment have been notified.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Job Title *</label>
              <input required value={form.title} onChange={set("title")} placeholder="e.g. Long-haul Flatbed Driver" className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description *</label>
              <textarea required rows={3} value={form.description} onChange={set("description")}
                placeholder="Describe the role, routes, schedule, and requirements…"
                className={inputCls + " resize-none"} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Location *</label>
                <input required value={form.location} onChange={set("location")} placeholder="e.g. Nairobi CBD" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Salary / Pay Range</label>
                <input value={form.salary_range} onChange={set("salary_range")} placeholder="e.g. KES 60,000/mo" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Required Truck Type</label>
              <select value={form.required_truck_type} onChange={set("required_truck_type")} className={inputCls}>
                <option value="">Any type</option>
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            {err && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" /> {err}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={mut.isPending}
                className="flex-1 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {mut.isPending ? "Posting…" : "Post Job"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── My Team card ──────────────────────────────────────────────────────────────
function TeamDriverCard({ driver, onDismiss, dismissing }) {
  const [open, setOpen] = useState(false);
  const avail = AVAIL_META[driver.availability_status] || AVAIL_META.offline;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <Avatar name={driver.full_name} photo={driver.profile_photo_url} size={12} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-slate-900">{driver.full_name || "Unknown Driver"}</p>
            <VerBadge ntsa={driver.ntsa_verified} status={driver.verification_status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{driver.email}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${avail.bg} ${avail.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
              {avail.label}
            </span>
            {driver.experience_years && (
              <span className="text-[10px] text-slate-500">{driver.experience_years}y exp</span>
            )}
            {driver.licence_class && (
              <span className="text-[10px] text-slate-500">Class {driver.licence_class}</span>
            )}
            {driver.rating != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{driver.total_trips} trips</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDismiss(driver.id)}
            disabled={dismissing}
            title="Remove from team"
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {driver.current_truck_id && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned Truck</p>
                <p className="text-slate-700 font-mono font-semibold">{driver.current_truck_id}</p>
              </div>
            </div>
          )}
          {driver.availability_location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-slate-700">{driver.availability_location}</p>
              </div>
            </div>
          )}
          {driver.preferred_routes && (
            <div className="sm:col-span-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Preferred Routes</p>
              <p className="text-slate-600">{driver.preferred_routes}</p>
            </div>
          )}
          {driver.bio && (
            <div className="sm:col-span-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Bio</p>
              <p className="text-slate-600">{driver.bio}</p>
            </div>
          )}
          {driver.licence_expiry && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Licence Expiry</p>
              <p className="text-slate-700">{driver.licence_expiry}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Find Drivers card ─────────────────────────────────────────────────────────
function SeekingDriverCard({ driver, onInvite, inviting, invited }) {
  const avail = AVAIL_META[driver.availability_status] || AVAIL_META.offline;
  const alreadyEmployed = Boolean(driver.employer_id);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-start gap-4">
      <Avatar name={driver.full_name} photo={driver.profile_photo_url} size={11} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading font-bold text-slate-900 text-sm">{driver.full_name || "Driver"}</p>
          <VerBadge ntsa={driver.ntsa_verified} status={driver.verification_status} />
          {driver.seeking_employment && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
              Open to Work
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${avail.bg} ${avail.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
            {avail.label}
          </span>
          {driver.experience_years && <span className="text-[10px] text-slate-500">{driver.experience_years}y exp</span>}
          {driver.licence_class && <span className="text-[10px] text-slate-500">Licence Class {driver.licence_class}</span>}
          {driver.rating != null && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{driver.total_trips} trips</span>
        </div>
        {driver.availability_location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{driver.availability_location}</span>
          </div>
        )}
        {driver.preferred_routes && (
          <p className="text-[10px] text-slate-400 mt-1 truncate">Routes: {driver.preferred_routes}</p>
        )}
        {driver.bio && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{driver.bio}</p>
        )}
      </div>
      <div className="shrink-0 pt-1">
        {alreadyEmployed ? (
          <span className="text-[10px] text-slate-400 italic">Employed</span>
        ) : invited ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
            <CheckCircle2 className="w-3 h-3" /> Invited
          </span>
        ) : (
          <button
            onClick={() => onInvite(driver.id)}
            disabled={inviting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-[11px] font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
            {inviting ? "Sending…" : "Invite"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerDriversPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("team");
  const [search, setSearch] = useState("");
  const [filterSeeking, setFilterSeeking] = useState(false);
  const [filterTruckType, setFilterTruckType] = useState("");
  const [showJobModal, setShowJobModal] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [dismissingId, setDismissingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const toast = (msg, ok = true) => {
    setToastMsg({ msg, ok });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: ["owner-my-team"],
    queryFn: () => apiClient.get("/drivers/my-team").then(r => r.data),
    staleTime: 20_000,
  });

  const { data: seekingAll = [], isLoading: seekLoading } = useQuery({
    queryKey: ["owner-seeking-drivers"],
    queryFn: () => apiClient.get("/drivers/seeking").then(r => r.data),
    staleTime: 20_000,
    enabled: tab === "find",
  });

  const dismissMut = useMutation({
    mutationFn: (id) => apiClient.delete(`/drivers/${id}/dismiss`),
    onMutate: (id) => setDismissingId(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-my-team"] });
      toast("Driver removed from your team.");
    },
    onError: () => toast("Failed to remove driver.", false),
    onSettled: () => setDismissingId(null),
  });

  const inviteMut = useMutation({
    mutationFn: (id) => apiClient.post(`/drivers/${id}/invite`),
    onMutate: (id) => setInvitingId(id),
    onSuccess: (_, id) => {
      setInvitedIds(s => new Set([...s, id]));
      toast("Invitation sent to driver.");
    },
    onError: (e) => toast(e?.response?.data?.detail || "Failed to send invite.", false),
    onSettled: () => setInvitingId(null),
  });

  // Filter seeking list
  const seeking = seekingAll.filter(d => {
    const q = search.toLowerCase();
    const matchName = !q || (d.full_name || "").toLowerCase().includes(q) ||
      (d.availability_location || "").toLowerCase().includes(q);
    const matchSeeking = !filterSeeking || d.seeking_employment;
    const matchTruck = !filterTruckType ||
      (d.preferred_truck_types || "").toLowerCase().includes(filterTruckType);
    return matchName && matchSeeking && matchTruck;
  });

  // Filter team list
  const filteredTeam = team.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.full_name || "").toLowerCase().includes(q) ||
      (d.availability_location || "").toLowerCase().includes(q);
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Driver Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your employed drivers and find new talent.</p>
        </div>
        <button
          onClick={() => setShowJobModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Briefcase className="w-4 h-4" />
          Post a Job
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "My Team",          value: team.length,                                                  color: "text-slate-900"  },
          { label: "On a Job",         value: team.filter(d => d.availability_status === "on_job").length,  color: "text-sky-600"    },
          { label: "Available",        value: team.filter(d => d.availability_status === "available").length,color: "text-teal-600"  },
          { label: "NTSA Verified",    value: team.filter(d => d.ntsa_verified).length,                     color: "text-green-600"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-heading font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {[
          { key: "team", icon: Users,     label: "My Team"       },
          { key: "find", icon: UserPlus,  label: "Find Drivers"  },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
            {key === "team" && team.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                {team.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "team" ? "Search your team…" : "Search by name or location…"}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors"
          />
        </div>
        {tab === "find" && (
          <>
            <button
              onClick={() => setFilterSeeking(s => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-colors ${
                filterSeeking
                  ? "bg-violet-800 border-violet-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              Open to Work Only
            </button>
            <select
              value={filterTruckType}
              onChange={(e) => setFilterTruckType(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2.5 focus:border-secondary outline-none"
            >
              <option value="">All Truck Types</option>
              {TRUCK_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </>
        )}
      </div>

      {/* ── My Team tab ── */}
      {tab === "team" && (
        <div className="space-y-3">
          {teamLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />
            ))
          ) : filteredTeam.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-20 text-center shadow-sm">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-heading font-semibold text-slate-400 mb-1">
                {team.length === 0 ? "No drivers on your team yet" : "No drivers match your search"}
              </p>
              {team.length === 0 && (
                <p className="text-sm text-slate-400 mt-1">
                  Assign a driver via{" "}
                  <a href="/owner/fleet" className="text-secondary font-semibold hover:underline">Fleet Management</a>
                  {" "}or invite drivers from the{" "}
                  <button onClick={() => setTab("find")} className="text-secondary font-semibold hover:underline">Find Drivers</button>
                  {" "}tab.
                </p>
              )}
            </div>
          ) : (
            filteredTeam.map(d => (
              <TeamDriverCard
                key={d.id}
                driver={d}
                onDismiss={(id) => dismissMut.mutate(id)}
                dismissing={dismissingId === d.id}
              />
            ))
          )}
        </div>
      )}

      {/* ── Find Drivers tab ── */}
      {tab === "find" && (
        <div className="space-y-3">
          {seekLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />
            ))
          ) : seeking.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-20 text-center shadow-sm">
              <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-heading font-semibold text-slate-400">
                {seekingAll.length === 0 ? "No drivers currently available" : "No drivers match your filters"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">{seeking.length} driver{seeking.length !== 1 ? "s" : ""} found</p>
              {seeking.map(d => (
                <SeekingDriverCard
                  key={d.id}
                  driver={d}
                  onInvite={(id) => inviteMut.mutate(id)}
                  inviting={invitingId === d.id}
                  invited={invitedIds.has(d.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Post Job Modal */}
      {showJobModal && <PostJobModal onClose={() => setShowJobModal(false)} />}

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toastMsg.ok
            ? "bg-teal-50 border-teal-200 text-teal-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toastMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
