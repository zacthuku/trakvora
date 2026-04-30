import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Truck, Search, Filter, ArrowRight, MapPin,
  Package, Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, ChevronDown, Eye,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { formatKES } from "@/utils/currency";

const PAGE_SIZE = 12;

const ACTIVE_STATUSES = ["assigned", "in_transit", "available", "pending_pickup"];

const STATUS_CONFIG = {
  available:       { label: "Available",       bg: "bg-sky-50",     text: "text-sky-700",    dot: "bg-sky-400"     },
  assigned:        { label: "Assigned",         bg: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-500"  },
  pending_pickup:  { label: "Pending Pickup",   bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400"   },
  in_transit:      { label: "In Transit",       bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-[#4fdbcc]"   },
  delivered:       { label: "Delivered",        bg: "bg-primary/10", text: "text-primary",    dot: "bg-primary"     },
  cancelled:       { label: "Cancelled",        bg: "bg-secondary/10", text: "text-secondary", dot: "bg-secondary"  },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "in_transit" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function LoadCard({ load }) {
  const pickup = load.pickup_location?.split(",")[0] || load.pickup_location;
  const dropoff = load.dropoff_location?.split(",")[0] || load.dropoff_location;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className={`h-[3px] ${
        load.status === "in_transit" ? "bg-[#4fdbcc]" :
        load.status === "assigned" ? "bg-violet-400" :
        load.status === "pending_pickup" ? "bg-amber-400" :
        "bg-slate-200"
      }`} />

      <div className="p-5">
        {/* ID + status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="font-mono text-xs font-bold text-primary tracking-wide">
              TRK-{load.id.slice(0, 8).toUpperCase()}
            </span>
            <p className="text-[10px] text-slate-400 capitalize mt-0.5">
              {load.cargo_type} · {load.weight_tonnes}t
            </p>
          </div>
          <StatusPill status={load.status} />
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-lg px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">From</p>
            <p className="font-semibold text-slate-800 text-sm truncate">{pickup}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">To</p>
            <p className="font-semibold text-slate-800 text-sm truncate">{dropoff}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Distance</p>
            <p className="font-mono text-sm font-semibold text-slate-700">
              {load.distance_km ? `${load.distance_km.toLocaleString()}km` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Payout</p>
            <p className="font-mono text-sm font-semibold text-secondary">{formatKES(load.price_kes)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Mode</p>
            <p className="text-xs text-slate-600 capitalize font-medium">{load.booking_mode || "spot"}</p>
          </div>
        </div>

        {/* Pickup schedule */}
        {load.pickup_date && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Pickup: {load.pickup_date}{load.pickup_window ? ` · ${load.pickup_window}` : ""}</span>
          </div>
        )}

        {/* Action */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Link
            to={`/owner/marketplace/${load.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View Details
          </Link>
          {load.status === "available" && (
            <Link
              to={`/owner/marketplace/${load.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-[11px] font-semibold hover:opacity-90 transition-opacity"
            >
              <Truck className="w-3.5 h-3.5" /> Claim Load
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OwnerActiveLoadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-active-loads"],
    queryFn: () =>
      apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 200 } }).then((r) => r.data),
  });

  const allLoads = data?.items || [];
  const activeLoads = allLoads.filter((l) => ACTIVE_STATUSES.includes(l.status));

  const filtered = useMemo(() => {
    return activeLoads.filter((l) => {
      const matchSearch =
        !search ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
        l.dropoff_location.toLowerCase().includes(search.toLowerCase()) ||
        l.cargo_type.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [activeLoads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const inTransit = activeLoads.filter((l) => l.status === "in_transit").length;
  const assigned = activeLoads.filter((l) => l.status === "assigned").length;
  const available = activeLoads.filter((l) => l.status === "available").length;

  const selectCls =
    "pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 appearance-none";

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Active Loads</h1>
          <p className="text-slate-500 text-sm mt-1">Loads assigned to your fleet or available to claim.</p>
        </div>
        <Link
          to="/owner/marketplace"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Package className="w-4 h-4" />
          Browse Marketplace
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "In Transit", value: inTransit, color: "text-[#4fdbcc]", sub: "currently moving" },
          { label: "Assigned", value: assigned, color: "text-violet-600", sub: "awaiting pickup" },
          { label: "Available", value: available, color: "text-sky-600", sub: "ready to claim" },
          { label: "Total Active", value: activeLoads.length, color: "text-slate-900", sub: "all statuses" },
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
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ID, route or cargo…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary text-slate-700 appearance-none"
          >
            <option value="">All Statuses</option>
            {ACTIVE_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filtered.length} load{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Load cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-56 animate-pulse" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center shadow-sm">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {activeLoads.length === 0 ? "No active loads right now." : "No loads match your filters."}
          </p>
          <Link to="/owner/marketplace"
            className="inline-flex items-center gap-1.5 mt-4 text-secondary text-sm font-semibold hover:opacity-80 transition-opacity">
            Go to Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pageItems.map((load) => (
            <LoadCard key={load.id} load={load} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-sm text-slate-500">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${safePage === n ? "bg-secondary text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
