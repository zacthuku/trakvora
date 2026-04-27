import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { shipperApi } from "@/features/shipper/api/shipperApi";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";
import { toast } from "@/components/ui/Toast";

export default function BidComparisonPage() {
  const { loadId } = useParams();
  const qc = useQueryClient();

  const { data: load } = useQuery({
    queryKey: ["load", loadId],
    queryFn: () => shipperApi.getLoad(loadId),
  });

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ["bids", loadId],
    queryFn: () => shipperApi.getBids(loadId),
  });

  const accept = useMutation({
    mutationFn: (bidId) => shipperApi.acceptBid(bidId),
    onSuccess: () => {
      toast("Bid accepted — shipment created!");
      qc.invalidateQueries({ queryKey: ["bids", loadId] });
      qc.invalidateQueries({ queryKey: ["shipper-loads"] });
    },
    onError: (err) => toast(err.response?.data?.detail || "Failed", "error"),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-1">
        Bids
      </h1>
      {load && (
        <p className="text-slate-500 text-sm mb-6">
          {load.pickup_location} → {load.dropoff_location} · {formatKES(load.price_kes)}
        </p>
      )}

      {bids.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No bids yet</div>
      ) : (
        <div className="flex flex-col gap-3">
          {bids.map((bid, idx) => (
            <div
              key={bid.id}
              className={`card-accent p-5 flex items-center justify-between ${
                idx === 0 ? "border-t-tertiary-fixed-dim" : ""
              }`}
            >
              <div>
                {idx === 0 && (
                  <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                    Lowest bid
                  </span>
                )}
                <div className="text-xl font-heading font-bold text-slate-900">
                  {formatKES(bid.amount_kes)}
                </div>
                {bid.message && (
                  <p className="text-sm text-slate-500 mt-1">{bid.message}</p>
                )}
                <div className="data-id mt-1">{bid.id.slice(0, 8)}…</div>
              </div>
              {bid.status === "pending" ? (
                <Button
                  onClick={() => accept.mutate(bid.id)}
                  loading={accept.isPending}
                  className="shrink-0"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </Button>
              ) : (
                <span className="text-sm font-medium text-teal-600 capitalize">
                  {bid.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
