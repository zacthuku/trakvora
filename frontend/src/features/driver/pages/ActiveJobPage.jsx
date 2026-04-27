import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Navigation } from "lucide-react";
import { driverApi } from "@/features/driver/api/driverApi";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTrackingSocket } from "@/hooks/useWebSocket";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

const STATUS_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "en_route_pickup", label: "En Route" },
  { key: "loaded", label: "Loaded" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

const NEXT_STATUS = {
  booked: "en_route_pickup",
  en_route_pickup: "loaded",
  loaded: "in_transit",
  in_transit: "delivered",
};

export default function ActiveJobPage() {
  const qc = useQueryClient();
  const { position } = useGeolocation();
  const [activeShipmentId, setActiveShipmentId] = useState(null);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["active-shipment", activeShipmentId],
    queryFn: () => driverApi.getShipment(activeShipmentId),
    enabled: !!activeShipmentId,
    refetchInterval: 15000,
  });

  const { send } = useTrackingSocket(activeShipmentId);

  useEffect(() => {
    if (!position || !activeShipmentId) return;
    driverApi
      .updateLocation(activeShipmentId, {
        latitude: position.latitude,
        longitude: position.longitude,
      })
      .catch(() => {});
    send({ latitude: position.latitude, longitude: position.longitude });
  }, [position, activeShipmentId]);

  const advance = useMutation({
    mutationFn: (next) =>
      driverApi.updateStatus(activeShipmentId, { status: next }),
    onSuccess: () => {
      toast("Status updated");
      qc.invalidateQueries({ queryKey: ["active-shipment", activeShipmentId] });
    },
    onError: (err) => toast(err.response?.data?.detail || "Failed", "error"),
  });

  if (!activeShipmentId) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
          Active Job
        </h1>
        <div className="card p-8 text-center">
          <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Enter a shipment ID to track it</p>
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full mb-3"
            placeholder="Shipment ID (UUID)"
            onKeyDown={(e) => {
              if (e.key === "Enter") setActiveShipmentId(e.target.value.trim());
            }}
          />
          <p className="text-xs text-slate-400">Press Enter to load</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <PageSpinner />;
  if (!shipment) return <div className="text-slate-500">Shipment not found</div>;

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === shipment.status);
  const nextStatus = NEXT_STATUS[shipment.status];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">
        Active Job
      </h1>
      <div className="data-id mb-6">{shipment.id}</div>

      <div className="card-accent p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">Status</h2>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="flex items-center gap-2">
          {STATUS_STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`status-timeline-dot ${
                    idx <= currentIdx
                      ? "border-secondary bg-secondary"
                      : "border-slate-300 bg-white"
                  }`}
                />
                <span className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-10 mb-4 ${
                    idx < currentIdx ? "bg-secondary" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {position && (
        <div className="card p-4 mb-4 flex items-center gap-2 text-sm text-slate-600">
          <Navigation className="w-4 h-4 text-secondary" />
          Location: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          <span className="text-xs text-slate-400">· Auto-sending</span>
        </div>
      )}

      {nextStatus && (
        <Button
          onClick={() => advance.mutate(nextStatus)}
          loading={advance.isPending}
          className="w-full justify-center"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as {STATUS_STEPS.find((s) => s.key === nextStatus)?.label}
        </Button>
      )}

      {shipment.status === "delivered" && (
        <div className="card p-6 text-center mt-4">
          <CheckCircle className="w-10 h-10 text-teal-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-900">Delivery Complete!</p>
          <p className="text-sm text-slate-500 mt-1">
            Payment will be released once confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
