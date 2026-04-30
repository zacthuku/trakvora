import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

const TX_TYPE_COLORS = {
  escrow_hold:    "bg-amber-900/40 text-amber-300 border-amber-700/40",
  escrow_release: "bg-green-900/40 text-green-300 border-green-700/40",
  escrow_refund:  "bg-blue-900/40 text-blue-300 border-blue-700/40",
  payout:         "bg-violet-900/40 text-violet-300 border-violet-700/40",
  top_up:         "bg-teal-900/40 text-teal-300 border-teal-700/40",
  platform_fee:   "bg-orange-900/40 text-orange-300 border-orange-700/40",
  dispute_hold:   "bg-red-900/40 text-red-300 border-red-700/40",
};

const TX_STATUS_COLORS = {
  completed: "text-green-400",
  pending:   "text-amber-400",
  failed:    "text-red-400",
  reversed:  "text-slate-500",
};

const ROLE_COLORS = {
  shipper: "text-blue-400",
  owner:   "text-amber-400",
  driver:  "text-green-400",
  admin:   "text-violet-400",
};

const TX_TYPES = ["", "escrow_hold", "escrow_release", "escrow_refund", "payout", "top_up", "platform_fee", "dispute_hold"];
const TX_STATUSES = ["", "completed", "pending", "failed", "reversed"];

export default function AdminWalletsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const LIMIT = 20;

  const { data: dash } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
    staleTime: 30_000,
  });

  const params = {
    page,
    limit: LIMIT,
    ...(typeFilter && { type: typeFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-transactions", params],
    queryFn: () => adminApi.getTransactions(params),
    staleTime: 15_000,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const txs = data?.items ?? [];
  const f = dash?.finance ?? {};

  const fmtKes = (n) => {
    if (!n) return "KES 0";
    if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
    return `KES ${n}`;
  };

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">Finance & Wallets</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform revenue, wallet balances, and transaction history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Platform Revenue", value: fmtKes(f.platform_revenue_kes), color: "text-green-400", sub: "All-time fee income" },
          { label: "Total Wallet Float", value: fmtKes(f.total_wallet_balance_kes), color: "text-white", sub: "Combined wallet balances" },
          { label: "Escrowed", value: fmtKes(f.total_escrow_kes), color: "text-amber-400", sub: "Pending release" },
          { label: "Transactions", value: (f.total_transactions ?? 0).toString(), color: "text-violet-400", sub: "Total records" },
        ].map((c) => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <p className={`text-xl font-bold font-heading ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-heading mt-1">{c.label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-violet-500 outline-none"
        >
          {TX_TYPES.map((t) => (
            <option key={t} value={t}>{t ? t.replace(/_/g, " ") : "All Types"}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-violet-500 outline-none"
        >
          {TX_STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      {/* Transaction table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Type</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Reference</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Description</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : txs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No transactions found</td></tr>
              ) : (
                txs.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-white">{tx.user_name}</p>
                      <p className={`text-[10px] font-semibold capitalize font-heading ${ROLE_COLORS[tx.user_role] ?? "text-slate-500"}`}>{tx.user_role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest font-heading ${TX_TYPE_COLORS[tx.transaction_type] ?? "bg-slate-800 text-slate-500 border-slate-700"}`}>
                        {tx.transaction_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-white font-heading">
                        KES {(tx.amount_kes ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold capitalize font-heading ${TX_STATUS_COLORS[tx.status] ?? "text-slate-400"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500 font-mono">{tx.reference || "–"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500 line-clamp-2 max-w-[200px]">{tx.description || "–"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" }) : "–"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Showing {txs.length ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total}
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
