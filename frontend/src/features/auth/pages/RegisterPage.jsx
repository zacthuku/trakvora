import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package2, Truck, UserCircle2, User, Building2,
  Mail, Lock, Phone, Eye, EyeOff, ArrowRight, CheckCircle, Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/features/auth/api/authApi";
import { LogoFull } from "@/components/ui/Logo";
import { SocialButton, AppleIcon } from "@/components/ui/SocialButtons";
import PasswordStrength, { isPasswordStrong } from "@/features/auth/components/PasswordStrength";
import OtpModal from "@/features/auth/components/OtpModal";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";

const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const ROLES = [
  { value: "shipper", label: "Shipper",     desc: "Manage outbound freight and track deliveries.", icon: Package2    },
  { value: "owner",   label: "Fleet Owner", desc: "Dispatch vehicles and monitor performance.",     icon: Truck       },
  { value: "driver",  label: "Driver",      desc: "Accept loads and update transit status.",        icon: UserCircle2 },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    email: "", phone: "", full_name: "", company_name: "", password: "", role: "shipper",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState(null);

  const redirectUser = (user) => {
    if (user.role === "shipper") navigate("/shipper");
    else if (user.role === "driver") navigate("/driver");
    else navigate("/owner");
  };

  const passwordMismatch = confirmPassword && form.password !== confirmPassword;
  const passwordWeak = form.password && !isPasswordStrong(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.requires_verification) {
        setOtpEmail(res.email);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg || "Registration failed" : detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = async (tokens) => {
    const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());
    setAuth(user, tokens.access_token, tokens.refresh_token);
    redirectUser(user);
  };

  return (
    <>
      {otpEmail && (
        <OtpModal email={otpEmail} onSuccess={handleOtpSuccess} onClose={() => setOtpEmail(null)} />
      )}

      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="w-full px-6 py-4 flex justify-center items-center border-b border-slate-200 bg-white">
          <Link to="/"><LogoFull iconSize={28} variant="light" /></Link>
        </header>

        <main className="flex-grow flex items-center justify-center px-4 py-10 lg:px-10">
          <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* ── Left hero panel ── */}
            <div className="hidden lg:flex flex-col gap-6">
              <div>
                <h1 className="font-heading text-4xl font-bold text-primary mb-3 tracking-tight leading-tight">
                  Join the Kinetic Network
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Accelerate your logistics operations with precision control and real-time tracking across East Africa.
                </p>
              </div>
              <div className="relative w-full h-96 rounded-xl overflow-hidden border border-slate-200">
                <div className="absolute inset-0 bg-primary" />
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, #fe6a34, transparent 65%)" }} />
                <div className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full opacity-15"
                  style={{ background: "radial-gradient(circle, #4fdbcc, transparent 65%)" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
                <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 flex items-center gap-3">
                  <Zap className="w-4 h-4 text-secondary shrink-0" />
                  <span className="font-data-mono text-xs text-white tracking-wide">ACTIVE_NODES: 24,891</span>
                </div>
                <div className="absolute top-20 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 flex items-center gap-3">
                  <Truck className="w-4 h-4 text-[#4fdbcc] shrink-0" />
                  <span className="font-data-mono text-xs text-white tracking-wide">FLEET_LIVE: 3,204</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4fdbcc] shrink-0" />
                    <div>
                      <div className="text-white text-sm font-semibold font-heading">NBO → MSA in 8h 22m</div>
                      <div className="text-slate-400 text-xs mt-0.5">Last verified corridor — live ETA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Registration form card ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-semibold text-primary mb-1 tracking-tight">Create Account</h2>
                <p className="text-slate-500 text-sm">Select your role to configure your dashboard.</p>
              </div>

              {/* Role selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {ROLES.map(({ value, label, desc, icon: Icon }) => {
                  const active = form.role === value;
                  return (
                    <button key={value} type="button"
                      onClick={() => setForm({ ...form, role: value })}
                      className={`relative text-left p-3 rounded-lg border transition-all duration-150 ${
                        active ? "border-secondary bg-orange-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-secondary/40 hover:bg-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${active ? "text-secondary" : "text-slate-400"}`} />
                      <div className={`text-sm font-semibold font-heading mb-0.5 ${active ? "text-primary" : "text-slate-700"}`}>{label}</div>
                      <p className="text-xs text-slate-500 leading-tight">{desc}</p>
                      {active && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-secondary" />}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Full Name" icon={<User />}
                  type="text" placeholder="Jane Doe" required
                  value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />

                <Field label="Company Name" icon={<Building2 />} optional
                  type="text" placeholder="Global Logistics Ltd"
                  value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />

                <Field label="Work Email" icon={<Mail />}
                  type="email" placeholder="jane@company.com" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

                <Field label="Phone" icon={<Phone />}
                  type="tel" placeholder="+254712345678" required
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

                <div>
                  <Field label="Password" icon={<Lock />}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" required minLength={8}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    rightElement={
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <PasswordStrength password={form.password} />
                </div>

                <Field label="Confirm Password" icon={<Lock />}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  error={passwordMismatch ? "Passwords do not match" : null}
                  rightElement={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showConfirm ? "Hide" : "Show"}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="pt-1 flex flex-col gap-3">
                  <button type="submit" disabled={loading || !!passwordMismatch || !!passwordWeak}
                    className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-semibold text-sm py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wide">
                    {loading ? "Creating account…" : "Initialize Account"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">Or sign up with</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {googleConfigured ? (
                      <GoogleAuthButton
                        onSuccess={(user, at, rt) => { setAuth(user, at, rt); redirectUser(user); }}
                        onError={setError}
                      />
                    ) : (
                      <SocialButton disabled title="Add VITE_GOOGLE_CLIENT_ID to enable" label="Google" icon={
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                          <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                          <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                          <path d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z" fill="#34A853"/>
                        </svg>
                      } />
                    )}
                    <SocialButton icon={<AppleIcon />} label="Apple" disabled />
                  </div>

                  <p className="text-center text-sm text-slate-500">
                    Already part of the network?{" "}
                    <Link to="/login" className="text-primary font-semibold hover:text-secondary transition-colors">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Field({ label, icon, optional, rightElement, error, ...inputProps }) {
  const hasError = Boolean(error);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
        {optional && <span className="text-xs text-slate-400">optional</span>}
      </div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
        <input
          {...inputProps}
          className={`w-full pl-10 ${rightElement ? "pr-10" : "pr-4"} py-3 border rounded-lg bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-shadow ${
            hasError ? "border-red-300 focus:border-red-400 focus:ring-red-300" : "border-slate-200 focus:border-secondary focus:ring-secondary"
          }`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
