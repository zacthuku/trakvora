import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, ShieldOff, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

const ROLE_BADGE = {
  shipper: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  owner: "bg-amber-900/50 text-amber-300 border-amber-700/50",
  driver: "bg-green-900/50 text-green-300 border-green-700/50",
  admin: "bg-violet-900/50 text-violet-300 border-violet-700/50",
};

function Badge({ text, color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${color}`}>
      {text}
    </span>
  );
}

function StarRating({ rating }) {
  const r = Math.round(rating ?? 0);
  return (
    <span className="text-xs text-amber-400 font-heading font-semibold">
      {"★".repeat(Math.min(r, 5))}{"☆".repeat(Math.max(0, 5 - r))}
      <span className="text-slate-500 ml-1">{(rating ?? 0).toFixed(1)}</span>
    </span>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const LIMIT = 15;

  const params = {
    page,
    limit: LIMIT,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(activeFilter !== "" && { is_active: activeFilter === "true" }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 15_000,
  });

  const suspendMut = useMutation({
    mutationFn: (id) => adminApi.suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const verifyMut = useMutation({
    mutationFn: (id) => adminApi.verifyUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const users = data?.items ?? [];

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">User Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-violet-500 outline-none"
        >
          <option value="">All Roles</option>
          <option value="shipper">Shipper</option>
          <option value="owner">Fleet Owner</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-violet-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Role</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Rating</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Trips</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Status</th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Verified</th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-600">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-300 font-heading">
                            {u.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{u.full_name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                          {u.company_name && (
                            <p className="text-[10px] text-slate-600">{u.company_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge text={u.role} color={ROLE_BADGE[u.role] ?? "bg-slate-800 text-slate-400 border-slate-700"} />
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3"><StarRating rating={u.rating} /></td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className="text-xs text-slate-300 font-heading font-semibold">{u.total_trips}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        text={u.is_active ? "Active" : "Suspended"}
                        color={u.is_active ? "bg-green-900/40 text-green-400 border-green-700/40" : "bg-red-900/40 text-red-400 border-red-700/40"}
                      />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      {u.is_verified
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-slate-600" />}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-[10px] text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" }) : "–"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== "admin" && (
                          <>
                            <button
                              onClick={() => verifyMut.mutate(u.id)}
                              title={u.is_verified ? "Unverify" : "Verify"}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-green-400 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => suspendMut.mutate(u.id)}
                              title={u.is_active ? "Suspend" : "Unsuspend"}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900">
          <p className="text-[11px] text-slate-500">
            Showing {users.length ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 min-w-[60px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
