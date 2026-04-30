import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, CheckCircle2, Gavel, Truck, Star,
  Clock, Package, MapPin, TrendingDown, Award,
  AlertCircle, ChevronRight, Zap, MessageSquare,
  Navigation2, Scale,
} from "lucide-react";
import { shipperApi } from "@/features/shipper/api/shipperApi";
import { formatKES } from "@/utils/currency";
import { toast } from "@/components/ui/Toast";
import { useState } from "react";

const STATUS_CONFIG = {
  available: { bg: "bg-amber-50", text: "text-amber-700", label: "Awaiting Bids" },
  booked:    { bg: "bg-violet-50", text: "text-violet-700", label: "Booked" },
  in_transit:{ bg: "bg-teal-50", text: "text-teal-700", label: "In Transit" },
};

function BidRankBadge({ rank, isLowest, isBestValue }) {
  if (rank === 0 && isLowest) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4fdbcc]/10 text-teal-700 text-[10px] font-bold uppercase tracking-wider border border-teal-200">
      <TrendingDown className="w-3 h-3" /> Lowest Bid
    </span>
  );
  if (isBestValue) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
      <Zap className="w-3 h-3" /> Best Value
    </span>
  );
  return null;
}

function AcceptModal({ bid, load, onClose, onConfirm, isPending }) {
  const savings = load?.price_kes ? load.price_kes - bid.amount_kes : null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="font-heading font-bold text-slate-900 text-lg">Confirm Bid Acceptance</h2>
          <p className="text-slate-500 text-xs mt-0.5">Review the details before confirming.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Bid amount */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 text-center">
            <p className="text-[10px] text-teal-600 uppercase tracking-wider mb-1">Accepted Bid</p>
            <p className="text-3xl font-heading font-bold text-teal-700">{formatKES(bid.amount_kes)}</p>
            {savings !== null && savings > 0 && (
              <p className="text-xs text-teal-600 mt-1 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {formatKES(savings)} below your asking price
              </p>
            )}
          </div>

          {bid.message && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Carrier Message</p>
              <p className="text-sm text-slate-700 italic">"{bid.message}"</p>
            </div>
          )}

          <div className="text-sm text-slate-600 space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              A shipment record will be created and the load marked as Booked.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              Funds will be placed in escrow until delivery is confirmed.
            </p>
            <p className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              Other pending bids will be automatically rejected.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />  Accepting…</>
              : <><CheckCircle2 className="w-4 h-4" /> Accept Bid</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BidComparisonPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmBid, setConfirmBid] = useState(null);

  const { data: load } = useQuery({
    queryKey: ["load", loadId],
    queryFn: () => shipperApi.getLoad(loadId),
  });

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ["bids", loadId],
    queryFn: () => shipperApi.getBids(loadId),
    refetchInterval: 15000,
  });

  const accept = useMutation({
    mutationFn: (bidId) => shipperApi.acceptBid(bidId),
    onSuccess: () => {
      toast("Bid accepted — shipment created!", "success");
      qc.invalidateQueries({ queryKey: ["bids", loadId] });
      qc.invalidateQueries({ queryKey: ["shipper-loads"] });
      qc.invalidateQueries({ queryKey: ["shipper-active-loads"] });
      setConfirmBid(null);
      navigate("/shipper/shipments");
    },
    onError: (err) => toast(err.response?.data?.detail || "Failed to accept bid", "error"),
  });

  const sortedBids = [...bids].sort((a, b) => a.amount_kes - b.amount_kes);
  const lowestBid = sortedBids[0];
  const acceptedBid = bids.find((b) => b.status === "accepted");
  const pendingBids = bids.filter((b) => b.status === "pending");
  const savings = load && lowestBid ? load.price_kes - lowestBid.amount_kes : 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {confirmBid && (
        <AcceptModal
          bid={confirmBid}
          load={load}
          onClose={() => setConfirmBid(null)}
          onConfirm={() => accept.mutate(confirmBid.id)}
          isPending={accept.isPending}
        />
      )}

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <button onClick={() => navigate("/shipper/shipments")} className="hover:text-slate-600 transition-colors">
            Active Loads
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Bid Comparison</span>
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Bid Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review carrier bids and accept the best offer for your load.
        </p>
      </div>

      {/* Load summary card */}
      {load && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="h-[3px] bg-secondary" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-primary tracking-wide">
                  TRK-{load.id?.slice(0, 8).toUpperCase()}
                </span>
                <h2 className="font-heading font-semibold text-slate-900 mt-0.5">Load Summary</h2>
              </div>
              {STATUS_CONFIG[load.status] && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[load.status].bg} ${STATUS_CONFIG[load.status].text}`}>
                  {STATUS_CONFIG[load.status].label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Route */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Route</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    <span className="truncate max-w-[90px]">{load.pickup_location?.split(",")[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[90px]">{load.dropoff_location?.split(",")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Cargo */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Cargo</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{load.cargo_type} · {load.weight_tonnes}t</p>
                </div>
              </div>
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3">
              <div className="text-center bg-slate-50 rounded-lg py-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Your Price</p>
                <p className="font-mono font-bold text-slate-900 text-base">{formatKES(load.price_kes)}</p>
              </div>
              <div className="text-center bg-slate-50 rounded-lg py-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Distance</p>
                <p className="font-mono font-bold text-slate-900 text-base">
                  {load.distance_km ? `${load.distance_km.toLocaleString()} km` : "—"}
                </p>
              </div>
              <div className="text-center bg-slate-50 rounded-lg py-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Bids</p>
                <p className="font-mono font-bold text-secondary text-base">{bids.length}</p>
              </div>
            </div>

            {/* Savings callout */}
            {savings > 0 && pendingBids.length > 0 && (
              <div className="mt-4 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                <TrendingDown className="w-4 h-4 text-teal-600 shrink-0" />
                <p className="text-sm text-teal-800">
                  Best bid saves you <span className="font-bold">{formatKES(savings)}</span> vs your asking price.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bids section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-semibold text-slate-900">
            Carrier Bids
            <span className="text-slate-400 font-normal text-sm ml-2">({bids.length} received)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Sorted by price · refreshes every 15 seconds</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbcc] animate-pulse" /> Live
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-28 animate-pulse" />
          ))}
        </div>
      ) : acceptedBid ? (
        /* Accepted bid state */
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-[#4fdbcc]" />
          <div className="px-6 py-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-bold text-slate-900">Bid Accepted</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {formatKES(acceptedBid.amount_kes)} · Shipment created and carrier notified
              </p>
            </div>
            <button onClick={() => navigate("/shipper/shipments")}
              className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Navigation2 className="w-4 h-4" /> Track Shipment
            </button>
          </div>
        </div>
      ) : sortedBids.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Gavel className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No bids yet</p>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-5">
            Your load is live on the marketplace. Carriers in the East Africa corridor will bid shortly.
          </p>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" /> Most loads receive their first bid within 30 minutes
          </div>
        </div>
      ) : (
        /* Bid cards */
        <div className="space-y-3">
          {sortedBids.map((bid, idx) => {
            const isLowest = idx === 0;
            const bidSavings = load ? load.price_kes - bid.amount_kes : 0;
            const isPending = bid.status === "pending";

            return (
              <div key={bid.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                  isLowest ? "border-teal-200" : "border-slate-200"
                }`}>
                {isLowest && <div className="h-[3px] bg-[#4fdbcc]" />}

                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    {/* Bid amount + badges */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-heading font-bold text-slate-900">
                          {formatKES(bid.amount_kes)}
                        </span>
                        {bidSavings > 0 && (
                          <span className="text-sm text-teal-600 font-semibold">
                            -{formatKES(bidSavings)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <BidRankBadge rank={idx} isLowest={isLowest} isBestValue={idx === 1} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPending ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isPending ? "Pending" : bid.status}
                        </span>
                      </div>
                    </div>

                    {/* Accept button */}
                    {isPending && (
                      <button
                        onClick={() => setConfirmBid(bid)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                          isLowest
                            ? "bg-secondary text-white hover:opacity-90 shadow-[0_4px_12px_rgba(254,106,52,0.25)]"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isLowest ? "Accept — Best Price" : "Accept Bid"}
                      </button>
                    )}
                  </div>

                  {/* Message */}
                  {bid.message && (
                    <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5 mb-3">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 italic">"{bid.message}"</p>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span className="font-mono">ID: {bid.id.slice(0, 8).toUpperCase()}</span>
                    <span>
                      {new Date(bid.created_at).toLocaleString("en-KE", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      Rank #{idx + 1} of {sortedBids.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guidance footer */}
      {pendingBids.length > 0 && (
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <Scale className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">How to choose the best bid</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• The <span className="text-teal-600 font-semibold">Lowest Bid</span> saves you the most money</li>
              <li>• Read carrier messages for context on reliability and experience</li>
              <li>• Once accepted, funds move to escrow and the carrier is dispatched</li>
              <li>• You have until the carrier arrives at pickup to cancel without penalty</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
