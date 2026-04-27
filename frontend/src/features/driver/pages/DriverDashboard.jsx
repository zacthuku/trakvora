import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { driverApi } from "@/features/driver/api/driverApi";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

export default function DriverDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: wallet } = useQuery({
    queryKey: ["driver-wallet"],
    queryFn: driverApi.getWallet,
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["driver-marketplace"],
    queryFn: () => driverApi.getMarketplace({ page: 1, page_size: 5 }),
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

      <div className="grid grid-cols-3 gap-4 mb-8">
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
