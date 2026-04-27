import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import apiClient from "@/services/apiClient";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

export default function ActiveShipmentsPage() {
  const { data: loadsData, isLoading } = useQuery({
    queryKey: ["shipper-active-loads"],
    queryFn: () =>
      apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 50 } }).then((r) => r.data),
  });

  if (isLoading) return <PageSpinner />;

  const active = (loadsData?.items || []).filter((l) =>
    ["booked", "en_route_pickup", "loaded", "in_transit"].includes(l.status)
  );

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Active Shipments
      </h1>

      {active.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No active shipments
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((load) => (
            <div key={load.id} className="card-accent p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {load.pickup_location} → {load.dropoff_location}
                  </div>
                  <div className="data-id mt-1">{load.id.slice(0, 8)}…</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {load.weight_tonnes}t · {formatKES(load.price_kes)}
                    {load.corridor && ` · ${load.corridor}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={load.status} />
                  <Link
                    to={`/shipper/bids/${load.id}`}
                    className="text-secondary text-sm font-medium"
                  >
                    View bids
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />
                {load.status === "in_transit"
                  ? "Truck is in transit"
                  : "Awaiting driver update"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
