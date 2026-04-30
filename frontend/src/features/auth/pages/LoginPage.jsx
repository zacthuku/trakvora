import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/features/auth/api/authApi";
import { LogoFull } from "@/components/ui/Logo";
import { SocialButton, AppleIcon } from "@/components/ui/SocialButtons";
import OtpModal from "@/features/auth/components/OtpModal";
import OtpChannelPicker from "@/features/auth/components/OtpChannelPicker";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";

const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // step: null | "channel_picker" | "otp"
  const [step, setStep] = useState(null);
  const [otpState, setOtpState] = useState(null); // { email, channel, destination }
  const [channelPickerState, setChannelPickerState] = useState(null); // { email, phoneAvailable }

  const redirectUser = (user) => {
    if (user.role === "shipper") navigate("/shipper");
    else if (user.role === "driver") navigate("/driver");
    else if (user.role === "owner") navigate("/owner");
    else if (user.role === "admin") navigate("/admin");
    else navigate("/");
  };

  const fetchUserAndRedirect = async (tokens) => {
    const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());
    setAuth(user, tokens.access_token, tokens.refresh_token);
    redirectUser(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(form);

      if (res.requires_channel_selection) {
        // First login — user must choose email or SMS
        setChannelPickerState({ email: res.email, phoneAvailable: res.phone_available });
        setStep("channel_picker");
        return;
      }

      if (res.requires_verification) {
        // Existing user with channel already set — or new user (email only)
        setOtpState({ email: res.email, channel: res.channel, destination: res.destination });
        setStep("otp");
        return;
      }

      // Should not happen with new backend, but handle gracefully
      await fetchUserAndRedirect(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Called when user picks a channel in the picker
  const handleChannelSent = (res) => {
    setOtpState({ email: res.email, channel: res.channel, destination: res.destination });
    setStep("otp");
  };

  const reset = () => {
    setStep(null);
    setOtpState(null);
    setChannelPickerState(null);
  };

  return (
    <>
      {step === "channel_picker" && channelPickerState && (
        <OtpChannelPicker
          email={channelPickerState.email}
          phoneAvailable={channelPickerState.phoneAvailable}
          onSent={handleChannelSent}
          onClose={reset}
        />
      )}

      {step === "otp" && otpState && (
        <OtpModal
          email={otpState.email}
          channel={otpState.channel}
          destination={otpState.destination}
          onSuccess={fetchUserAndRedirect}
          onClose={reset}
        />
      )}

      <div className="flex w-full min-h-screen">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary flex-col justify-end p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #fe6a34, transparent 70%)" }} />
          <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #4fdbcc, transparent 70%)" }} />

          <div className="absolute top-10 left-10 z-10">
            <Link to="/"><LogoFull iconSize={36} variant="dark" /></Link>
          </div>

          <div className="relative z-10 max-w-lg">
            <h2 className="font-heading text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Kinetic Precision<br />Engineering.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Advanced supply chain visibility designed for heavy-duty reliability and high-velocity logistics across East Africa.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  { initials: "MK", bg: "bg-orange-500" },
                  { initials: "AO", bg: "bg-teal-500" },
                  { initials: "JN", bg: "bg-blue-500" },
                ].map(({ initials, bg }) => (
                  <div key={initials}
                    className={`w-10 h-10 rounded-full border-2 border-primary ${bg} flex items-center justify-center text-white text-xs font-bold font-heading`}>
                    {initials}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold font-heading">
                  +2k
                </div>
              </div>
              <p className="text-sm text-slate-400">Join thousands of East Africa operators.</p>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 sm:px-12 relative">
          <div className="absolute top-6 left-6 flex lg:hidden">
            <Link to="/"><LogoFull iconSize={28} /></Link>
          </div>

          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-semibold text-slate-900 mb-1 tracking-tight">Sign In</h1>
              <p className="text-slate-500 text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input id="email" type="email" required placeholder="name@company.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs text-secondary font-medium hover:opacity-80 transition-opacity">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input id="password" type={showPassword ? "text" : "password"} required placeholder="••••••••"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input id="remember" type="checkbox" checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary cursor-pointer" />
                <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-white font-semibold text-sm rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Signing in…" : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">Or continue with</span>
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

            <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-secondary font-semibold hover:opacity-80 transition-opacity">
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
