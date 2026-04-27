import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

export default function ShipmentHistoryPage() {
  const { data: loadsData, isLoading } = useQuery({
    queryKey: ["shipper-history"],
    queryFn: () =>
      apiClient.get("/loads/marketplace", { params: { page: 1, page_size: 50 } }).then((r) => r.data),
  });

  if (isLoading) return <PageSpinner />;

  const history = (loadsData?.items || []).filter((l) =>
    ["delivered", "cancelled"].includes(l.status)
  );

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Shipment History
      </h1>

      {history.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No completed shipments yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 font-medium">Route</th>
                <th className="pb-3 font-medium">Weight</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((load) => (
                <tr key={load.id}>
                  <td className="py-3">
                    <div className="font-medium text-slate-900">
                      {load.pickup_location} → {load.dropoff_location}
                    </div>
                    <div className="data-id">{load.id.slice(0, 8)}…</div>
                  </td>
                  <td className="py-3 text-slate-600">{load.weight_tonnes}t</td>
                  <td className="py-3 font-data-mono">{formatKES(load.price_kes)}</td>
                  <td className="py-3">
                    <StatusBadge status={load.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
