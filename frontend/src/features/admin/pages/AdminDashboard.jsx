import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, Package, Truck, CreditCard, ShieldCheck,
  AlertTriangle, Navigation2, CheckCircle2, TrendingUp,
  Clock, Activity, ArrowRight,
} from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function fmtKes(n) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n ?? 0}`;
}

function timeSince(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, to }) {
  const inner = (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group ${to ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {to && <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-white font-heading mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-heading">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function HBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-slate-400 capitalize shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-slate-300 text-right font-heading font-semibold">{value}</span>
    </div>
  );
}

const ACTIVITY_ICON = {
  bid_received: { icon: Package, color: "text-blue-400 bg-blue-900/40" },
  bid_accepted: { icon: CheckCircle2, color: "text-green-400 bg-green-900/40" },
  bid_rejected: { icon: AlertTriangle, color: "text-red-400 bg-red-900/40" },
  shipment_booked: { icon: Navigation2, color: "text-violet-400 bg-violet-900/40" },
  in_transit: { icon: Activity, color: "text-amber-400 bg-amber-900/40" },
  delivered: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-900/40" },
  payment_released: { icon: CreditCard, color: "text-teal-400 bg-teal-900/40" },
  default: { icon: Clock, color: "text-slate-400 bg-slate-800" },
};

function ActivityItem({ item }) {
  const { icon: Icon, color } = ACTIVITY_ICON[item.type] ?? ACTIVITY_ICON.default;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white leading-snug">{item.title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.body}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{item.user_name} · {timeSince(item.created_at)}</p>
      </div>
    </div>
  );
}

function LoadStatusBar({ status, count, total }) {
  const COLORS = {
    available: "bg-blue-500",
    bidding: "bg-amber-500",
    booked: "bg-violet-500",
    en_route_pickup: "bg-orange-500",
    loaded: "bg-cyan-500",
    in_transit: "bg-indigo-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
  };
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-slate-400 truncate capitalize shrink-0">{status.replace("_", " ")}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${COLORS[status] ?? "bg-slate-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-300 font-heading">{count}</span>
      <span className="w-8 text-right text-[10px] text-slate-600">{pct}%</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const u = data?.users ?? {};
  const l = data?.loads ?? {};
  const s = data?.shipments ?? {};
  const d = data?.drivers ?? {};
  const t = data?.trucks ?? {};
  const f = data?.finance ?? {};
  const activity = data?.recent_activity ?? [];

  const totalUsers = u.total ?? 0;
  const byRole = u.by_role ?? {};
  const byStatus = l.by_status ?? {};
  const totalLoads = l.total ?? 0;

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform overview · live data</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Auto-refreshes every 60s
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="Total Users" value={fmt(u.total)}
          sub={`${u.suspended ?? 0} suspended`}
          color="bg-blue-900/50 text-blue-400" to="/admin/users"
        />
        <KpiCard
          icon={Package} label="Total Loads" value={fmt(totalLoads)}
          sub={`${(byStatus.available ?? 0) + (byStatus.bidding ?? 0)} open`}
          color="bg-amber-900/50 text-amber-400" to="/admin/loads"
        />
        <KpiCard
          icon={Navigation2} label="Active Shipments" value={fmt(s.active)}
          sub={`${s.delivered ?? 0} delivered`}
          color="bg-violet-900/50 text-violet-400" to="/admin/shipments"
        />
        <KpiCard
          icon={CreditCard} label="Platform Revenue" value={fmtKes(f.platform_revenue_kes)}
          sub={`${f.total_transactions ?? 0} transactions`}
          color="bg-green-900/50 text-green-400" to="/admin/wallets"
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={ShieldCheck} label="Pending Verification" value={fmt(d.pending_verifications)}
          sub={`${d.verified ?? 0} verified drivers`}
          color="bg-orange-900/50 text-orange-400" to="/admin/drivers"
        />
        <KpiCard
          icon={AlertTriangle} label="Open Disputes" value={fmt(s.open_disputes)}
          sub={`${s.total ?? 0} total shipments`}
          color="bg-red-900/50 text-red-400" to="/admin/shipments?disputes_only=true"
        />
        <KpiCard
          icon={Truck} label="Active Trucks" value={fmt(t.active)}
          sub={`${t.total ?? 0} registered`}
          color="bg-cyan-900/50 text-cyan-400" to="/admin/trucks"
        />
        <KpiCard
          icon={TrendingUp} label="Wallet Balance" value={fmtKes(f.total_wallet_balance_kes)}
          sub={`${fmtKes(f.total_escrow_kes)} in escrow`}
          color="bg-teal-900/50 text-teal-400" to="/admin/wallets"
        />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by role */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white font-heading uppercase tracking-widest">Users by Role</h2>
            <Link to="/admin/users" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">View all →</Link>
          </div>
          <div className="space-y-4">
            <HBar label="Shippers" value={byRole.shipper ?? 0} max={totalUsers} color="bg-blue-500" />
            <HBar label="Owners" value={byRole.owner ?? 0} max={totalUsers} color="bg-amber-500" />
            <HBar label="Drivers" value={byRole.driver ?? 0} max={totalUsers} color="bg-emerald-500" />
            <HBar label="Admins" value={byRole.admin ?? 0} max={totalUsers} color="bg-violet-500" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white font-heading">{u.verified ?? 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white font-heading">{u.active ?? 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Active</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400 font-heading">{u.suspended ?? 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Suspended</p>
            </div>
          </div>
        </div>

        {/* Loads by status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white font-heading uppercase tracking-widest">Loads by Status</h2>
            <Link to="/admin/loads" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">View all →</Link>
          </div>
          <div className="space-y-3">
            {Object.entries(byStatus).length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">No load data</p>
            ) : (
              Object.entries(byStatus).map(([st, cnt]) => (
                <LoadStatusBar key={st} status={st} count={cnt} total={totalLoads} />
              ))
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white font-heading">{(byStatus.available ?? 0) + (byStatus.bidding ?? 0)}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Open</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white font-heading">{s.active ?? 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">In Transit</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400 font-heading">{byStatus.delivered ?? 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white font-heading uppercase tracking-widest">Recent Activity</h2>
            <span className="text-[10px] text-slate-600 font-heading uppercase">Live feed</span>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No recent activity</p>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1">
              {activity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Driver & finance summary */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xs font-bold text-white font-heading uppercase tracking-widest mb-4">Driver Verification</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Pending review</span>
                <span className="text-sm font-bold text-amber-400 font-heading">{d.pending_verifications ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Approved</span>
                <span className="text-sm font-bold text-green-400 font-heading">{d.verified ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Available now</span>
                <span className="text-sm font-bold text-blue-400 font-heading">{d.available ?? 0}</span>
              </div>
            </div>
            {d.pending_verifications > 0 && (
              <Link to="/admin/drivers?verification_status=pending"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold uppercase tracking-widest py-2.5 rounded-lg transition-colors font-heading">
                Review Queue
              </Link>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xs font-bold text-white font-heading uppercase tracking-widest mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Platform revenue</span>
                <span className="text-xs font-bold text-green-400 font-heading">{fmtKes(f.platform_revenue_kes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total wallet float</span>
                <span className="text-xs font-bold text-white font-heading">{fmtKes(f.total_wallet_balance_kes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Escrowed</span>
                <span className="text-xs font-bold text-amber-400 font-heading">{fmtKes(f.total_escrow_kes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Transactions</span>
                <span className="text-xs font-bold text-white font-heading">{f.total_transactions ?? 0}</span>
              </div>
            </div>
            <Link to="/admin/wallets"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold uppercase tracking-widest py-2.5 rounded-lg transition-colors font-heading">
              View Finance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
