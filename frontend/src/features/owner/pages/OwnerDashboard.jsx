import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Truck, TrendingUp, Users, Download, ArrowRight,
  Zap, MapPin, Navigation2,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { formatKES } from "@/utils/currency";

function MetricCard({ topColor, icon: Icon, label, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 left-0 w-full h-[3px] ${topColor}`} />
      <div className="flex justify-between items-start mb-4">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <Icon className="w-5 h-5 text-slate-300" />
      </div>
      {children}
    </div>
  );
}

function TelemetryMap({ trucks }) {
  const withCoords = trucks.filter((t) => t.current_latitude && t.current_longitude);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 flex justify-between items-center bg-white">
        <h2 className="font-heading font-semibold text-slate-900 flex items-center gap-2 text-base">
          <Navigation2 className="w-5 h-5 text-secondary" />
          Live Telemetry Map
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {trucks.filter((t) => t.is_active).length} units broadcasting
        </span>
      </div>

      {/* Map area */}
      <div className="relative bg-[#0b1929] min-h-[380px] overflow-hidden">
        {/* Dot-grid background */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(#4fdbcc 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Glow blobs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fe6a34, transparent 70%)" }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4fdbcc, transparent 70%)" }} />

        {/* Region focus overlay */}
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2.5 z-10">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Region</p>
          <p className="text-sm font-semibold text-white font-heading">East Africa Corridor</p>
        </div>

        {/* Corridor route lines (decorative) */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <polyline points="180,80 280,160 340,260 420,320" stroke="#4fdbcc" strokeWidth="1.5" fill="none" strokeDasharray="6 3" />
          <polyline points="120,200 220,240 300,200 380,180" stroke="#fe6a34" strokeWidth="1.5" fill="none" strokeDasharray="6 3" />
          <polyline points="260,60 300,140 360,200 440,240" stroke="#4fdbcc" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        </svg>

        {/* Truck markers — live if coords, animated if not */}
        {withCoords.length > 0 ? withCoords.slice(0, 8).map((t, i) => (
          <div key={t.id}
            className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_12px_rgba(79,219,204,0.8)] bg-[#4fdbcc]"
            style={{ left: `${20 + (i * 9) % 60}%`, top: `${25 + (i * 13) % 50}%` }}
            title={t.registration_number}
          />
        )) : (
          <>
            {[
              { x: "30%", y: "35%", color: "bg-[#4fdbcc]", shadow: "shadow-[0_0_12px_rgba(79,219,204,0.8)]" },
              { x: "52%", y: "50%", color: "bg-secondary",  shadow: "shadow-[0_0_12px_rgba(254,106,52,0.8)]"  },
              { x: "68%", y: "28%", color: "bg-[#4fdbcc]", shadow: "shadow-[0_0_12px_rgba(79,219,204,0.8)]" },
              { x: "42%", y: "65%", color: "bg-[#4fdbcc]", shadow: "shadow-[0_0_12px_rgba(79,219,204,0.8)]" },
              { x: "75%", y: "58%", color: "bg-secondary",  shadow: "shadow-[0_0_12px_rgba(254,106,52,0.8)]"  },
            ].map((m, i) => (
              <div key={i} className="absolute" style={{ left: m.x, top: m.y }}>
                <span className={`absolute inline-flex w-4 h-4 rounded-full ${m.color} opacity-60 animate-ping`} />
                <span className={`relative inline-flex w-4 h-4 rounded-full ${m.color} border-2 border-white ${m.shadow}`} />
              </div>
            ))}
          </>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4fdbcc]" /> In Transit
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Delayed / Alert
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { data: trucks = [] } = useQuery({
    queryKey: ["owner-trucks"],
    queryFn: () => apiClient.get("/trucks").then((r) => r.data),
  });

  const { data: loadsData } = useQuery({
    queryKey: ["owner-marketplace"],
    queryFn: () => apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 10 } }).then((r) => r.data),
  });

  const { data: wallet } = useQuery({
    queryKey: ["owner-wallet"],
    queryFn: () => apiClient.get("/payments/wallet").then((r) => r.data),
  });

  const activeCount   = trucks.filter((t) => t.is_active).length;
  const totalCount    = trucks.length;
  const matches       = (loadsData?.items || []).filter((l) => l.status === "available").slice(0, 5);

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Fleet Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time telemetry and operational status for your network.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <Link to="/owner/fleet"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Truck className="w-4 h-4" />
            Dispatch Unit
          </Link>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Active Units */}
        <MetricCard topColor="bg-[#4fdbcc]" icon={Truck} label="Active Units">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold font-heading text-slate-900">{activeCount}</span>
            <span className="text-sm text-slate-400">/ {totalCount || "—"}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbcc]" /> On Time
            </span>
            {totalCount - activeCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-orange-50 text-secondary text-[11px] font-semibold flex items-center gap-1.5 border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {totalCount - activeCount} Idle
              </span>
            )}
          </div>
        </MetricCard>

        {/* Revenue */}
        <MetricCard topColor="bg-secondary" icon={TrendingUp} label="Current Cycle Revenue">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold font-heading text-slate-900">
              {wallet ? formatKES(wallet.balance) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#4fdbcc] text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Wallet balance</span>
          </div>
        </MetricCard>

        {/* Driver Roster */}
        <MetricCard topColor="bg-primary" icon={Users} label="Fleet Roster">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-700">Active trucks</span>
              <span className="font-mono font-semibold text-slate-900">{activeCount}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-[#4fdbcc] h-2 rounded-full transition-all"
                style={{ width: totalCount > 0 ? `${(activeCount / totalCount) * 100}%` : "0%" }} />
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-400">Idle / Offline</span>
              <span className="font-mono text-slate-400">{totalCount - activeCount}</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* ── Live Telemetry Map ── */}
      <div className="mb-6">
        <TelemetryMap trucks={trucks} />
      </div>

      {/* ── Return Load Matches ── */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">Return Load Matches</h2>
            <p className="text-slate-500 text-sm mt-0.5">Available loads for your fleet — claim to maximise yield.</p>
          </div>
          <Link to="/owner/marketplace"
            className="flex items-center gap-1 text-secondary text-sm font-semibold hover:opacity-80 transition-opacity">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Load ID</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cargo</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Payout</th>
                <th className="py-3 px-4 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No available loads in the marketplace right now.
                  </td>
                </tr>
              ) : matches.map((load) => (
                <tr key={load.id} className="group hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs font-semibold text-primary tracking-wide block">
                      TRK-{load.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{load.cargo_type} · {load.weight_tonnes}t</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-slate-800 truncate max-w-[110px]">
                        {load.pickup_location.split(",")[0]}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="font-medium text-slate-800 truncate max-w-[110px]">
                        {load.dropoff_location.split(",")[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-500 capitalize">{load.cargo_type}</td>
                  <td className="py-3.5 px-4 text-sm text-slate-500 font-mono whitespace-nowrap">
                    {load.distance_km ? `${load.distance_km.toLocaleString()} km` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-secondary whitespace-nowrap">
                    {formatKES(load.price_kes)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/owner/loads/${load.id}`}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
                        Claim Load
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
