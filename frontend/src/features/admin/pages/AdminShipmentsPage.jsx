import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

const STATUS_COLORS = {
  booked:          "bg-violet-900/40 text-violet-300 border-violet-700/40",
  en_route_pickup: "bg-orange-900/40 text-orange-300 border-orange-700/40",
  loaded:          "bg-cyan-900/40 text-cyan-300 border-cyan-700/40",
  in_transit:      "bg-indigo-900/40 text-indigo-300 border-indigo-700/40",
  delivered:       "bg-green-900/40 text-green-300 border-green-700/40",
  cancelled:       "bg-slate-800 text-slate-500 border-slate-700",
};

export default function AdminShipmentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [disputesOnly, setDisputesOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(null);
  const LIMIT = 15;

  const params = {
    page,
    limit: LIMIT,
    ...(disputesOnly && { disputes_only: true }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipments", params],
    queryFn: () => adminApi.getShipments(params),
    staleTime: 15_000,
  });

  const resolveMut = useMutation({
    mutationFn: (id) => adminApi.resolveDispute(id),
    onSuccess: () => {
      setConfirmResolve(null);
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const shipments = data?.items ?? [];

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Shipments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total shipments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setDisputesOnly(!disputesOnly); setPage(1); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest font-heading border transition-colors ${
              disputesOnly
                ? "bg-red-900/60 border-red-700 text-red-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Disputes Only
          </button>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:border-violet-500 outline-none"
          >
            <option value="">All Statuses</option>
            {["booked", "en_route_pickup", "loaded", "in_transit", "delivered", "cancelled"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resolve confirm */}
      {confirmResolve && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl my-auto">
            <h3 className="text-base font-bold text-white font-heading mb-2">Resolve Dispute</h3>
            <p className="text-sm text-slate-400 mb-5">
              Mark the dispute on shipment <strong className="text-white">{confirmResolve.route}</strong> as resolved?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmResolve(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={() => resolveMut.mutate(confirmResolve.id)} disabled={resolveMut.isPending}
                className="flex-1 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold">
                {resolveMut.isPending ? "Saving…" : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Route</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Shipper</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Value</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Escrow</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Dispute</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Delivered</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={8} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : shipments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-600">No shipments found</td></tr>
              ) : (
                shipments.map((sh) => (
                  <tr key={sh.id} className={`border-b border-slate-800 transition-colors ${sh.dispute_open ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-slate-800/30"}`}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-white leading-snug">{sh.pickup_location}</p>
                      <p className="text-[10px] text-slate-500">→ {sh.dropoff_location}</p>
                      {sh.corridor && <p className="text-[10px] text-violet-400">{sh.corridor}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">{sh.shipper_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-green-400 font-heading">
                        KES {(sh.price_kes ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          {sh.escrow_locked
                            ? <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                          <span className="text-[10px] text-slate-500">Locked</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {sh.escrow_released
                            ? <CheckCircle2 className="w-3 h-3 text-green-400" />
                            : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                          <span className="text-[10px] text-slate-500">Released</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${STATUS_COLORS[sh.status] ?? "bg-slate-800 text-slate-500 border-slate-700"}`}>
                        {sh.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sh.dispute_open ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-900/50 text-red-300 border-red-700/50 uppercase tracking-widest font-heading">
                          <AlertTriangle className="w-3 h-3" /> Open
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500">
                        {sh.delivered_at ? new Date(sh.delivered_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" }) : "–"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        {sh.dispute_open && (
                          <button
                            onClick={() => setConfirmResolve({ id: sh.id, route: `${sh.pickup_location} → ${sh.dropoff_location}` })}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-green-800/60 hover:bg-green-700/80 text-green-300 text-[10px] font-bold uppercase tracking-wide rounded-lg font-heading transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Showing {shipments.length ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 min-w-[60px] text-center">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
