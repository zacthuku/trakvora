import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Filter, MapPin } from "lucide-react";
import { driverApi } from "@/features/driver/api/driverApi";
import { useGeolocation } from "@/hooks/useGeolocation";
import Select from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";
import { haversineKm } from "@/utils/distance";
import { CARGO_TYPES, CORRIDORS } from "@/utils/constants";

export default function JobFeedPage() {
  const { position } = useGeolocation();
  const [cargoFilter, setCargoFilter] = useState("");
  const [corridorFilter, setCorridorFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["jobs-feed", cargoFilter, corridorFilter],
    queryFn: () =>
      driverApi.getMarketplace({
        cargo_type: cargoFilter || undefined,
        corridor: corridorFilter || undefined,
        page: 1,
        page_size: 30,
      }),
  });

  if (isLoading) return <PageSpinner />;

  let loads = data?.items || [];

  if (position) {
    loads = [...loads].sort((a, b) => {
      const da = haversineKm(position.latitude, position.longitude, a.pickup_latitude, a.pickup_longitude);
      const db = haversineKm(position.latitude, position.longitude, b.pickup_latitude, b.pickup_longitude);
      const profitA = a.price_kes / (da + 1);
      const profitB = b.price_kes / (db + 1);
      return profitB - profitA;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Job Feed</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select
            options={[{ value: "", label: "All cargo" }, ...CARGO_TYPES]}
            value={cargoFilter}
            onChange={(e) => setCargoFilter(e.target.value)}
            className="text-sm"
          />
          <Select
            options={[{ value: "", label: "All corridors" }, ...CORRIDORS.map((c) => ({ value: c, label: c }))]}
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {loads.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No loads match your filters</div>
      ) : (
        <div className="flex flex-col gap-3">
          {loads.map((load) => {
            const distKm = position
              ? Math.round(haversineKm(position.latitude, position.longitude, load.pickup_latitude, load.pickup_longitude))
              : null;

            return (
              <Link
                key={load.id}
                to={`/owner/loads/${load.id}`}
                className="card-accent p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {load.pickup_location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 my-1">
                      <div className="w-0.5 h-4 bg-slate-300 mx-1" />
                    </div>
                    <div className="font-semibold text-slate-900">
                      {load.dropoff_location}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{load.weight_tonnes}t</span>
                      <span>·</span>
                      <span className="capitalize">{load.cargo_type}</span>
                      {load.corridor && (
                        <>
                          <span>·</span>
                          <span>{load.corridor}</span>
                        </>
                      )}
                      {distKm !== null && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {distKm} km away
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-data-mono font-bold text-lg text-slate-900">
                      {formatKES(load.price_kes)}
                    </div>
                    <StatusBadge status={load.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
