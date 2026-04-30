import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, ShieldCheck, FileText } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

const STATUS_STYLES = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  approved: "bg-green-900/40 text-green-300 border-green-700/40",
  rejected: "bg-red-900/40 text-red-300 border-red-700/40",
};

const STATUS_ICON = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

function DocCheck({ has, label }) {
  return (
    <div className="flex items-center gap-1.5">
      {has
        ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
        : <XCircle className="w-3 h-3 text-red-500/60 shrink-0" />}
      <span className={`text-[10px] ${has ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}

export default function AdminDriversPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [pending, setPending] = useState(null);
  const LIMIT = 15;

  const params = {
    page,
    limit: LIMIT,
    ...(statusFilter && { verification_status: statusFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-drivers", params],
    queryFn: () => adminApi.getDrivers(params),
    staleTime: 15_000,
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateDriverVerification(id, status),
    onSuccess: () => {
      setPending(null);
      qc.invalidateQueries({ queryKey: ["admin-drivers"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const drivers = data?.items ?? [];

  return (
    <div className="py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Driver Verification</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} driver profiles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest font-heading border transition-colors ${
                statusFilter === s
                  ? "bg-violet-800 border-violet-600 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm py-8 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl my-auto">
            <h3 className="text-base font-bold text-white font-heading mb-2">
              {pending.action === "approved" ? "Approve Driver" : "Reject Driver"}
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              {pending.action === "approved"
                ? `Approve ${pending.name} and mark as NTSA verified?`
                : `Reject ${pending.name}'s verification request?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPending(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyMut.mutate({ id: pending.id, status: pending.action })}
                disabled={verifyMut.isPending}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${
                  pending.action === "approved"
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-red-700 hover:bg-red-600"
                }`}
              >
                {verifyMut.isPending ? "Saving…" : pending.action === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Driver</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Licence</th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Documents</th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Experience</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Availability</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-600">No drivers found</td>
                </tr>
              ) : (
                drivers.map((d) => {
                  const Icon = STATUS_ICON[d.verification_status] ?? Clock;
                  return (
                    <tr key={d.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-300 font-heading">
                              {d.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{d.full_name}</p>
                            <p className="text-[10px] text-slate-500">{d.email}</p>
                            <p className="text-[10px] text-amber-400">★ {(d.rating ?? 0).toFixed(1)} · {d.total_trips} trips</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <p className="text-xs text-white font-heading font-semibold">{d.licence_number}</p>
                        <p className="text-[10px] text-slate-500">Class {d.licence_class}</p>
                        <p className="text-[10px] text-slate-600">Exp: {d.licence_expiry || "–"}</p>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <div className="space-y-1">
                          <DocCheck has={d.has_licence_photo} label="Licence" />
                          <DocCheck has={d.has_passport_photo} label="Passport" />
                          <DocCheck has={d.has_psv_badge} label="PSV Badge" />
                          <DocCheck has={d.has_police_clearance} label="Police Cert" />
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className="text-xs text-slate-300">{d.experience_years ?? 0} yrs</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${
                          d.availability_status === "available"
                            ? "bg-green-900/40 text-green-300 border-green-700/40"
                            : d.availability_status === "on_job"
                            ? "bg-blue-900/40 text-blue-300 border-blue-700/40"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}>
                          {d.availability_status}
                        </span>
                        {d.availability_location && (
                          <p className="text-[10px] text-slate-600 mt-1">{d.availability_location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${STATUS_STYLES[d.verification_status]}`}>
                          <Icon className="w-3 h-3" />
                          {d.verification_status}
                        </span>
                        {d.ntsa_verified && (
                          <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> NTSA
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {d.verification_status !== "approved" && (
                            <button
                              onClick={() => setPending({ id: d.id, name: d.full_name, action: "approved" })}
                              className="px-2.5 py-1 bg-green-800/60 hover:bg-green-700/80 text-green-300 text-[10px] font-bold uppercase tracking-wide rounded-lg font-heading transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {d.verification_status !== "rejected" && (
                            <button
                              onClick={() => setPending({ id: d.id, name: d.full_name, action: "rejected" })}
                              className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800/80 text-red-300 text-[10px] font-bold uppercase tracking-wide rounded-lg font-heading transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Showing {drivers.length ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total}
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
