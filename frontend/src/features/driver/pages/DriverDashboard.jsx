import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, MapPin, User, Briefcase as BriefcaseIcon, CheckCircle2, Clock, WifiOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { driverApi } from "@/features/driver/api/driverApi";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    dot: "bg-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    btnActive: "bg-emerald-500 text-white shadow-sm",
    btnInactive: "bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700",
  },
  on_job: {
    label: "On Job",
    dot: "bg-sky-400 animate-pulse",
    pill: "bg-sky-50 text-sky-700 border-sky-200",
    btnActive: "bg-sky-500 text-white shadow-sm",
    btnInactive: "bg-white text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-700",
  },
  offline: {
    label: "Offline",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-500 border-slate-200",
    btnActive: "bg-slate-500 text-white shadow-sm",
    btnInactive: "bg-white text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-700",
  },
};

const STATUS_OPTIONS = [
  { value: "available", icon: CheckCircle2, label: "Available" },
  { value: "on_job",    icon: Clock,        label: "On Job"   },
  { value: "offline",   icon: WifiOff,      label: "Offline"  },
];

function AvailabilityWidget({ profile, onStatusChange, isPending }) {
  const current = profile?.availability_status || "offline";
  const cfg = STATUS_CONFIG[current] || STATUS_CONFIG.offline;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cfg.pill}`}>
            {cfg.label}
          </span>
          {profile?.seeking_employment && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
              Open to Work
            </span>
          )}
        </div>
        <Link to="/driver/profile" className="text-xs text-secondary font-semibold hover:underline flex items-center gap-1">
          <User className="w-3 h-3" /> Full Profile
        </Link>
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map(({ value, icon: Icon, label }) => {
          const isActive = current === value;
          const btn = isActive ? cfg.btnActive : STATUS_CONFIG[value].btnInactive;
          // use the target status config for active styling
          const activeCls = isActive
            ? STATUS_CONFIG[value].btnActive
            : STATUS_CONFIG[value].btnInactive;
          return (
            <button
              key={value}
              disabled={isPending}
              onClick={() => onStatusChange(value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${activeCls} disabled:opacity-50`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {profile?.availability_location && (
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {profile.availability_location}
        </p>
      )}
    </div>
  );
}

export default function DriverDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: wallet } = useQuery({
    queryKey: ["driver-wallet"],
    queryFn: driverApi.getWallet,
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["driver-marketplace"],
    queryFn: () => driverApi.getMarketplace({ page: 1, page_size: 5 }),
  });

  const { data: profile } = useQuery({
    queryKey: ["driver-profile-me"],
    queryFn: driverApi.getProfile,
    retry: false,
  });

  const availMutation = useMutation({
    mutationFn: (status) => driverApi.updateAvailability({ availability_status: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-profile-me"] }),
  });

  if (isLoading) return <PageSpinner />;

  const available = jobs?.items || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900">
          {user?.full_name?.split(" ")[0]}'s Hub
        </h1>
        <p className="text-slate-500 text-sm mt-1">Driver dashboard</p>
      </div>

      <AvailabilityWidget
        profile={profile}
        onStatusChange={(s) => availMutation.mutate(s)}
        isPending={availMutation.isPending}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card-accent p-5">
          <div className="text-3xl font-heading font-bold text-secondary">
            {formatKES(wallet?.balance_kes || 0)}
          </div>
          <div className="text-sm text-slate-500 mt-1">Wallet Balance</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-heading font-bold text-slate-700">
            {user?.total_trips || 0}
          </div>
          <div className="text-sm text-slate-500 mt-1">Completed Trips</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-heading font-bold text-tertiary-fixed-dim">
            {available.length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Available Loads</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold">Nearby Loads</h2>
        <Link to="/driver/jobs" className="text-secondary text-sm font-medium">
          View all →
        </Link>
      </div>

      {available.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No loads available right now</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {available.map((load) => (
            <Link
              key={load.id}
              to={`/driver/jobs`}
              className="card-accent p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-medium text-sm text-slate-900">
                  {load.pickup_location} → {load.dropoff_location}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {load.weight_tonnes}t · {load.cargo_type}
                  {load.corridor && ` · ${load.corridor}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono font-semibold text-slate-900">
                  {formatKES(load.price_kes)}
                </div>
                <StatusBadge status={load.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
