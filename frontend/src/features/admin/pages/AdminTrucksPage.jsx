import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Power } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

const TRUCK_TYPE_COLORS = {
  flatbed:  "text-amber-400",
  dry_van:  "text-blue-400",
  reefer:   "text-cyan-400",
  tanker:   "text-orange-400",
  lowbed:   "text-violet-400",
  tipper:   "text-green-400",
};

export default function AdminTrucksPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trucks", { page, limit: LIMIT }],
    queryFn: () => adminApi.getTrucks({ page, limit: LIMIT }),
    staleTime: 15_000,
  });

  const toggleMut = useMutation({
    mutationFn: (id) => adminApi.toggleTruckActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trucks"] }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const trucks = data?.items ?? [];

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">Fleet Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total} registered trucks</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Truck</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Owner</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Type</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Capacity</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">GPS</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Registered</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={8} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : trucks.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-600">No trucks found</td></tr>
              ) : (
                trucks.map((tr) => (
                  <tr key={tr.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-white font-heading">{tr.registration_number}</p>
                      <p className="text-[10px] text-slate-500">{[tr.make, tr.model, tr.year].filter(Boolean).join(" · ")}</p>
                      {tr.is_driver_owned && (
                        <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Owner-operated</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">{tr.owner_name}</p>
                      <p className="text-[10px] text-slate-500">{tr.owner_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold capitalize font-heading ${TRUCK_TYPE_COLORS[tr.truck_type] ?? "text-slate-300"}`}>
                        {tr.truck_type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300 font-heading font-semibold">{tr.capacity_tonnes}t</span>
                    </td>
                    <td className="px-4 py-3">
                      {tr.current_latitude ? (
                        <div>
                          <p className="text-[10px] text-green-400 font-semibold font-heading">Live</p>
                          <p className="text-[10px] text-slate-600">
                            {tr.current_latitude?.toFixed(4)}, {tr.current_longitude?.toFixed(4)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600">No GPS</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${
                        tr.is_active
                          ? "bg-green-900/40 text-green-300 border-green-700/40"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}>
                        {tr.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500">
                        {tr.created_at ? new Date(tr.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" }) : "–"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => toggleMut.mutate(tr.id)}
                          title={tr.is_active ? "Deactivate" : "Activate"}
                          className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${tr.is_active ? "text-green-400 hover:text-red-400" : "text-slate-600 hover:text-green-400"}`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
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
            Showing {trucks.length ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total}
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
