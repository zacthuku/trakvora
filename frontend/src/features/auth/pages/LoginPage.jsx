import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/features/auth/api/authApi";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await authApi.login(form);
      const user = await Promise.resolve(
        fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }).then((r) => r.json())
      );
      setAuth(user, tokens.access_token, tokens.refresh_token);
      if (user.role === "shipper") navigate("/shipper");
      else if (user.role === "driver") navigate("/driver");
      else if (user.role === "owner") navigate("/owner");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-6">
        Welcome back
      </h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full justify-center mt-2">
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="text-secondary font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}
