import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { shipperApi } from "@/features/shipper/api/shipperApi";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { CARGO_TYPES, TRUCK_TYPES } from "@/utils/constants";

const INITIAL = {
  pickup_location: "",
  pickup_latitude: "",
  pickup_longitude: "",
  dropoff_location: "",
  dropoff_latitude: "",
  dropoff_longitude: "",
  cargo_type: "general",
  weight_tonnes: "",
  price_kes: "",
  booking_mode: "fixed",
  cargo_description: "",
  required_truck_type: "",
  special_instructions: "",
  requires_insurance: false,
};

export default function PostLoadPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [step, setStep] = useState(1);

  const mutation = useMutation({
    mutationFn: shipperApi.createLoad,
    onSuccess: () => {
      toast("Load posted successfully!");
      navigate("/shipper");
    },
    onError: (err) => toast(err.response?.data?.detail || "Failed to post load", "error"),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      pickup_latitude: parseFloat(form.pickup_latitude),
      pickup_longitude: parseFloat(form.pickup_longitude),
      dropoff_latitude: parseFloat(form.dropoff_latitude),
      dropoff_longitude: parseFloat(form.dropoff_longitude),
      weight_tonnes: parseFloat(form.weight_tonnes),
      price_kes: parseFloat(form.price_kes),
    });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Post a Load
      </h1>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s ? "bg-secondary text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-secondary" : "bg-slate-200"}`} />}
          </div>
        ))}
        <div className="ml-4 flex gap-8 text-xs text-slate-500">
          <span className={step === 1 ? "text-secondary font-medium" : ""}>Route</span>
          <span className={step === 2 ? "text-secondary font-medium" : ""}>Cargo</span>
          <span className={step === 3 ? "text-secondary font-medium" : ""}>Pricing</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
        {step === 1 && (
          <>
            <h2 className="font-heading font-semibold text-slate-800">Route Details</h2>
            <Input label="Pickup Location" value={form.pickup_location} onChange={(e) => set("pickup_location", e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Pickup Latitude" type="number" step="any" value={form.pickup_latitude} onChange={(e) => set("pickup_latitude", e.target.value)} required placeholder="-1.2921" />
              <Input label="Pickup Longitude" type="number" step="any" value={form.pickup_longitude} onChange={(e) => set("pickup_longitude", e.target.value)} required placeholder="36.8219" />
            </div>
            <Input label="Dropoff Location" value={form.dropoff_location} onChange={(e) => set("dropoff_location", e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Dropoff Latitude" type="number" step="any" value={form.dropoff_latitude} onChange={(e) => set("dropoff_latitude", e.target.value)} required placeholder="-4.0435" />
              <Input label="Dropoff Longitude" type="number" step="any" value={form.dropoff_longitude} onChange={(e) => set("dropoff_longitude", e.target.value)} required placeholder="39.6682" />
            </div>
            <Button type="button" onClick={() => setStep(2)} className="self-end">
              Next →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-heading font-semibold text-slate-800">Cargo Details</h2>
            <Select label="Cargo Type" options={CARGO_TYPES} value={form.cargo_type} onChange={(e) => set("cargo_type", e.target.value)} />
            <Input label="Weight (tonnes)" type="number" step="0.1" min="0.1" value={form.weight_tonnes} onChange={(e) => set("weight_tonnes", e.target.value)} required />
            <Select label="Required Truck Type (optional)" options={[{ value: "", label: "Any" }, ...TRUCK_TYPES]} value={form.required_truck_type} onChange={(e) => set("required_truck_type", e.target.value)} />
            <div>
              <label className="text-sm font-medium text-slate-700">Cargo Description</label>
              <textarea
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                rows={3}
                value={form.cargo_description}
                onChange={(e) => set("cargo_description", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.requires_insurance}
                onChange={(e) => set("requires_insurance", e.target.checked)}
                className="accent-secondary"
              />
              Requires insurance
            </label>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Next →</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-heading font-semibold text-slate-800">Pricing</h2>
            <Select
              label="Booking Mode"
              options={[
                { value: "fixed", label: "Fixed Price" },
                { value: "auction", label: "Auction (accept bids)" },
              ]}
              value={form.booking_mode}
              onChange={(e) => set("booking_mode", e.target.value)}
            />
            <Input label="Price / Min Bid (KES)" type="number" min="1" value={form.price_kes} onChange={(e) => set("price_kes", e.target.value)} required />
            <div>
              <label className="text-sm font-medium text-slate-700">Special Instructions</label>
              <textarea
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                rows={2}
                value={form.special_instructions}
                onChange={(e) => set("special_instructions", e.target.value)}
              />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button type="submit" loading={mutation.isPending}>Post Load</Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
