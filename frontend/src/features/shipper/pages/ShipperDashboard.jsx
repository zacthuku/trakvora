import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PackagePlus, Truck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/apiClient";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

export default function ShipperDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: loadsData, isLoading } = useQuery({
    queryKey: ["shipper-loads"],
    queryFn: () =>
      apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 10 } }).then((r) => r.data),
  });

  if (isLoading) return <PageSpinner />;

  const loads = loadsData?.items || [];
  const active = loads.filter((l) =>
    ["booked", "en_route_pickup", "loaded", "in_transit"].includes(l.status)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900">
          Good day, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's your freight overview
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Loads", value: active.length, color: "text-secondary" },
          { label: "Total Loads", value: loads.length, color: "text-slate-700" },
          { label: "Available", value: loads.filter((l) => l.status === "available").length, color: "text-tertiary-fixed-dim" },
        ].map((stat) => (
          <div key={stat.label} className="card-accent p-5">
            <div className={`text-3xl font-heading font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold">Recent Loads</h2>
        <Link
          to="/shipper/post-load"
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <PackagePlus className="w-4 h-4" /> Post Load
        </Link>
      </div>

      {loads.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No loads posted yet</p>
          <Link to="/shipper/post-load" className="btn-primary text-sm">
            Post your first load
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {loads.slice(0, 5).map((load) => (
            <div key={load.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  {load.pickup_location} → {load.dropoff_location}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-data-mono">
                  {formatKES(load.price_kes)} · {load.weight_tonnes}t
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={load.status} />
                <Link to={`/shipper/bids/${load.id}`} className="text-slate-400 hover:text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
