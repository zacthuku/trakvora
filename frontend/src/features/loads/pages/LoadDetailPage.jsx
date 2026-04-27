import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Package, Truck } from "lucide-react";
import { loadsApi } from "@/features/loads/api/loadsApi";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatKES } from "@/utils/currency";

export default function LoadDetailPage() {
  const { loadId } = useParams();
  const qc = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");

  const { data: load, isLoading } = useQuery({
    queryKey: ["load", loadId],
    queryFn: () => loadsApi.getLoad(loadId),
  });

  const { data: trucks = [] } = useQuery({
    queryKey: ["my-trucks"],
    queryFn: loadsApi.getMyTrucks,
  });

  const bidMutation = useMutation({
    mutationFn: (data) => loadsApi.placeBid(data),
    onSuccess: () => {
      toast("Bid placed successfully!");
      setBidAmount("");
      setBidMessage("");
      qc.invalidateQueries({ queryKey: ["load", loadId] });
    },
    onError: (err) => toast(err.response?.data?.detail || "Bid failed", "error"),
  });

  if (isLoading) return <PageSpinner />;
  if (!load) return <div className="text-slate-500">Load not found</div>;

  const canBid = ["available", "bidding"].includes(load.status);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">
            Load Details
          </h1>
          <div className="data-id mt-1">{load.id}</div>
        </div>
        <StatusBadge status={load.status} />
      </div>

      <div className="card-accent p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <MapPin className="w-3 h-3" /> Pickup
            </div>
            <div className="font-semibold text-slate-900">{load.pickup_location}</div>
          </div>
          <div className="text-slate-300 font-bold mt-4">→</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <MapPin className="w-3 h-3" /> Dropoff
            </div>
            <div className="font-semibold text-slate-900">{load.dropoff_location}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <div className="text-xs text-slate-500">Price</div>
            <div className="font-data-mono font-bold text-slate-900 mt-0.5">
              {formatKES(load.price_kes)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Weight</div>
            <div className="font-semibold mt-0.5">{load.weight_tonnes}t</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Cargo Type</div>
            <div className="font-semibold capitalize mt-0.5">{load.cargo_type}</div>
          </div>
          {load.corridor && (
            <div>
              <div className="text-xs text-slate-500">Corridor</div>
              <div className="font-semibold mt-0.5">{load.corridor}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-slate-500">Booking Mode</div>
            <div className="font-semibold capitalize mt-0.5">{load.booking_mode}</div>
          </div>
          {load.requires_insurance && (
            <div>
              <div className="text-xs text-slate-500">Insurance</div>
              <div className="font-semibold text-amber-600 mt-0.5">Required</div>
            </div>
          )}
        </div>

        {load.cargo_description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Description</div>
            <p className="text-sm text-slate-700">{load.cargo_description}</p>
          </div>
        )}
        {load.special_instructions && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1">Special Instructions</div>
            <p className="text-sm text-slate-700 italic">{load.special_instructions}</p>
          </div>
        )}
      </div>

      {canBid && trucks.length > 0 && (
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-slate-900 mb-4">
            Place a Bid
          </h2>
          <div className="flex flex-col gap-3">
            <Select
              label="Select Truck"
              options={trucks.map((t) => ({
                value: t.id,
                label: `${t.registration_number} · ${t.truck_type} · ${t.capacity_tonnes}t`,
              }))}
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
            />
            <Input
              label={`Bid Amount (KES)${load.min_bid_floor_kes ? ` — min ${formatKES(load.min_bid_floor_kes)}` : ""}`}
              type="number"
              min={load.min_bid_floor_kes || 1}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-slate-700">Message (optional)</label>
              <textarea
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                rows={2}
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                bidMutation.mutate({
                  load_id: loadId,
                  truck_id: selectedTruck,
                  amount_kes: parseFloat(bidAmount),
                  message: bidMessage || undefined,
                })
              }
              loading={bidMutation.isPending}
              disabled={!selectedTruck || !bidAmount}
            >
              Submit Bid
            </Button>
          </div>
        </div>
      )}

      {trucks.length === 0 && canBid && (
        <div className="card p-6 text-center text-slate-500">
          <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          Add a truck to your fleet before bidding
        </div>
      )}
    </div>
  );
}
