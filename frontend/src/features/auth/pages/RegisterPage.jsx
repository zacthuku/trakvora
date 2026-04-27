import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/features/auth/api/authApi";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const ROLES = [
  { value: "shipper", label: "Shipper", desc: "I need to move cargo" },
  { value: "owner", label: "Truck Owner", desc: "I own trucks and bid on loads" },
  { value: "driver", label: "Driver", desc: "I drive and deliver cargo" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    full_name: "",
    company_name: "",
    password: "",
    role: "shipper",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await authApi.register(form);
      const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }).then((r) => r.json());
      setAuth(user, tokens.access_token, tokens.refresh_token);
      if (user.role === "shipper") navigate("/shipper");
      else if (user.role === "driver") navigate("/driver");
      else navigate("/owner");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-6">
        Create account
      </h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-700 mb-2">I am a…</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm({ ...form, role: r.value })}
              className={`border rounded-lg p-3 text-left transition-all ${
                form.role === r.value
                  ? "border-secondary bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="font-semibold text-sm">{r.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+254712345678"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <Input
          label="Company Name (optional)"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
        />
        <Button type="submit" loading={loading} className="w-full justify-center mt-2">
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-secondary font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
