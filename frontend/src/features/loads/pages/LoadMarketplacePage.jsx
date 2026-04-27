import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { loadsApi } from "@/features/loads/api/loadsApi";
import Select from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";
import { CARGO_TYPES, CORRIDORS } from "@/utils/constants";

export default function LoadMarketplacePage() {
  const [cargoType, setCargoType] = useState("");
  const [corridor, setCorridor] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", cargoType, corridor, page],
    queryFn: () =>
      loadsApi.getMarketplace({
        cargo_type: cargoType || undefined,
        corridor: corridor || undefined,
        page,
        page_size: 20,
      }),
  });

  if (isLoading) return <PageSpinner />;

  const loads = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Load Marketplace
      </h1>

      <div className="flex items-center gap-3 mb-6">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <Select
          options={[{ value: "", label: "All cargo types" }, ...CARGO_TYPES]}
          value={cargoType}
          onChange={(e) => { setCargoType(e.target.value); setPage(1); }}
        />
        <Select
          options={[{ value: "", label: "All corridors" }, ...CORRIDORS.map((c) => ({ value: c, label: c }))]}
          value={corridor}
          onChange={(e) => { setCorridor(e.target.value); setPage(1); }}
        />
        <span className="text-sm text-slate-500 ml-auto whitespace-nowrap">
          {total} loads
        </span>
      </div>

      {loads.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No loads match your filters
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {loads.map((load) => (
              <Link
                key={load.id}
                to={`/owner/loads/${load.id}`}
                className="card-accent p-5 flex items-start justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {load.pickup_location} → {load.dropoff_location}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {load.weight_tonnes}t · <span className="capitalize">{load.cargo_type}</span>
                    {load.corridor && ` · ${load.corridor}`}
                    {load.required_truck_type && ` · ${load.required_truck_type}`}
                  </div>
                  {load.special_instructions && (
                    <div className="text-xs text-slate-400 mt-1 italic">
                      {load.special_instructions}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="font-data-mono font-bold text-lg text-slate-900">
                    {formatKES(load.price_kes)}
                  </div>
                  <StatusBadge status={load.status} />
                  <div className="text-xs text-slate-400 mt-1 capitalize">
                    {load.booking_mode}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
