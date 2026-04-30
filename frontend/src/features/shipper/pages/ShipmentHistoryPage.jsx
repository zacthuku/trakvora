import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, CalendarDays, Filter, Download, FileText,
  Eye, Receipt, ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { formatKES } from "@/utils/currency";

const PAGE_SIZE = 10;

const DATE_RANGES = [
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "365", label: "This Year" },
  { value: "all", label: "All Time" },
];

function withinDays(dateStr, days) {
  if (days === "all") return true;
  const cutoff = Date.now() - parseInt(days, 10) * 86400 * 1000;
  return new Date(dateStr).getTime() >= cutoff;
}

function StatusPill({ status }) {
  const map = {
    delivered: "bg-primary/10 text-primary",
    cancelled: "bg-secondary/10 text-secondary",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default function ShipmentHistoryPage() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("90");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["shipper-history"],
    queryFn: () =>
      apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 200 } }).then((r) => r.data),
  });

  const filtered = useMemo(() => {
    const all = (data?.items || []).filter((l) =>
      ["delivered", "cancelled"].includes(l.status)
    );
    return all.filter((l) => {
      const matchSearch =
        !search ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
        l.dropoff_location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || l.status === statusFilter;
      const matchDate = withinDays(l.created_at, dateRange);
      return matchSearch && matchStatus && matchDate;
    });
  }, [data, search, statusFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const inputCls = "pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 placeholder:text-slate-400";

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Shipment History</h1>
        <p className="text-slate-500 text-sm mt-1">Review and export your past logistics data.</p>
      </div>

      {/* Filter & action bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ID or route…"
              className={`w-full ${inputCls}`}
            />
          </div>

          {/* Date range */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className={`pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 appearance-none`}
            >
              {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={`pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-slate-700 appearance-none`}
            >
              <option value="">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Export actions */}
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium whitespace-nowrap">
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium whitespace-nowrap">
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID / Route</th>
                <th className="hidden sm:table-cell py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="hidden md:table-cell py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cargo Type</th>
                <th className="hidden md:table-cell py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (KES)</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No shipments found</td></tr>
              ) : (
                pageItems.map((load) => (
                  <tr key={load.id} className="group hover:bg-slate-50/70 transition-colors">
                    {/* ID / Route */}
                    <td className="py-3.5 px-4">
                      <span className="block font-mono text-xs font-semibold text-primary tracking-wide">
                        TRK-{load.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <span className="truncate max-w-[100px]">{load.pickup_location.split(",")[0]}</span>
                        <ArrowRight className="w-3 h-3 shrink-0 text-slate-300" />
                        <span className="truncate max-w-[100px]">{load.dropoff_location.split(",")[0]}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="hidden sm:table-cell py-3.5 px-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(load.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>

                    {/* Cargo type */}
                    <td className="hidden md:table-cell py-3.5 px-4 text-sm text-slate-600 capitalize">{load.cargo_type}</td>

                    {/* Distance */}
                    <td className="hidden md:table-cell py-3.5 px-4 text-sm text-slate-500 font-mono whitespace-nowrap">
                      {load.distance_km ? `${load.distance_km.toLocaleString()} km` : "—"}
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-primary whitespace-nowrap">
                      {formatKES(load.price_kes)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusPill status={load.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View Details" className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Download Invoice" className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors">
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {filtered.length === 0 ? "No entries" : `Showing ${from}–${to} of ${filtered.length}`}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = i + 1;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${safePage === n ? "bg-secondary text-white" : "text-slate-500 hover:bg-slate-200"}`}>
                  {n}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
