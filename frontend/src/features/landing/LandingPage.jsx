import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Route, CheckCircle, Clock, Compass, CreditCard,
  Network, BarChart2, Menu, X, Truck, ArrowRight,
  Shield, Star, Zap, Users, Package, MapPin, ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/apiClient";

const NAV_LINKS = [
  { label: "How It Works", to: "/how-it-works" },
  { label: "Pricing",      to: "/pricing" },
  { label: "Help",         to: "/help" },
];

const CORRIDORS = [
  { short: "NBO → MSA", full: "Nairobi — Mombasa",       km: "485 km" },
  { short: "NBO → KLA", full: "Nairobi — Kampala",        km: "680 km" },
  { short: "NBO → DAR", full: "Nairobi — Dar es Salaam",  km: "1,150 km" },
  { short: "MSA → KLA", full: "Mombasa — Kampala",        km: "970 km" },
  { short: "NBO → ARU", full: "Nairobi — Arusha",         km: "280 km" },
  { short: "ELD → KLA", full: "Eldoret — Kampala",        km: "390 km" },
];

function StatPill({ value, label, loading }) {
  return (
    <div className="text-center">
      <p className="font-heading text-3xl md:text-4xl font-black text-white">
        {loading ? (
          <span className="inline-block w-12 h-8 bg-white/10 rounded animate-pulse" />
        ) : value}
      </p>
      <p className="text-slate-400 text-xs mt-1 font-medium">{label}</p>
    </div>
  );
}

function ShipmentRow({ id, origin, dest, status, accent }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer relative overflow-hidden">
      {accent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />}
      <div className="flex justify-between items-start mb-2">
        <div className="font-data-mono text-sm text-slate-300">{id}</div>
        {status === "done"
          ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#4fdbcc" }} />
          : <Clock className="w-4 h-4 shrink-0 text-secondary animate-pulse" />}
      </div>
      <div className="flex items-center gap-3 text-white text-sm">
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs">Origin</span>
          <span className="font-medium">{origin}</span>
        </div>
        <div className="flex-grow border-t border-dashed border-white/30 relative mx-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary rounded-full w-2 h-2" />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-slate-400 text-xs">Destination</span>
          <span className="font-medium">{dest}</span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ wide, icon, iconBg, title, children }) {
  return (
    <div className={`${wide ? "md:col-span-2" : ""} bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, color, bg, points, cta, to }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className={`${bg} px-8 py-6`}>
        <div className={`w-12 h-12 rounded-xl ${color} bg-white/20 flex items-center justify-center mb-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-heading text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="px-8 py-6">
        <ul className="space-y-3 mb-6">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
        <Link to={to}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary group-hover:gap-3 transition-all">
          {cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => apiClient.get("/stats").then((r) => r.data),
    staleTime: 60_000,
  });

  const dashboardTo =
    user?.role === "shipper" ? "/shipper" :
    user?.role === "driver"  ? "/driver"  :
    user?.role === "owner"   ? "/owner"   : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-shadow ${scrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <LogoFull iconSize={34} />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `font-heading text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                      isActive ? "text-secondary bg-orange-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardTo}
                className="hidden md:flex items-center gap-1.5 font-heading text-sm font-semibold text-secondary hover:opacity-80 transition-opacity">
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/login"
                className="hidden md:block font-heading text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded transition-colors">
                Log in
              </Link>
            )}
            <Link to={user ? dashboardTo : "/register"}
              className="hidden md:flex btn-primary text-sm items-center gap-1.5">
              <Truck className="w-4 h-4" />
              {user ? "Go to App" : "Get Started"}
            </Link>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block font-heading text-sm font-medium px-3 py-2.5 rounded transition-colors ${
                    isActive ? "text-secondary bg-orange-50" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                {label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link to={dashboardTo} onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login"    onClick={() => setMenuOpen(false)} className="btn-outline text-sm text-center">Log in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Logged-in banner ────────────────────────────────────────────── */}
      {user && (
        <div className="bg-secondary/5 border-b border-secondary/20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold text-slate-900 text-sm">
                Welcome back, {user.full_name?.split(" ")[0]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">Signed in as {user.role}</p>
            </div>
            <Link
              to={dashboardTo}
              className="inline-flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative bg-primary text-white overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 20% 50%, rgba(254,106,52,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 80%, rgba(79,219,204,0.12) 0%, transparent 40%)" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold font-heading text-secondary border border-secondary/30 bg-secondary/10 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              LIVE FREIGHT EXCHANGE
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Precision Logistics,<br />
              <span className="text-secondary">High-Velocity Network.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
              Connect shippers, fleet owners, and drivers across East Africa. Real-time tracking, competitive bidding, and seamless KES payments — all on one platform.
            </p>
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={dashboardTo}
                  className="bg-secondary text-white px-8 py-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95">
                  <LayoutDashboard className="w-5 h-5" /> Open Dashboard
                </Link>
                <Link to="/how-it-works"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors active:scale-95">
                  <ChevronRight className="w-5 h-5" /> Explore Features
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=shipper"
                  className="bg-secondary text-white px-8 py-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95">
                  <Package className="w-5 h-5" /> Post a Load
                </Link>
                <Link to="/register?role=driver"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors active:scale-95">
                  <Truck className="w-5 h-5" /> Find Jobs
                </Link>
              </div>
            )}

            {/* Trust strip */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-teal-400" /> NTSA Verified
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Star className="w-4 h-4 text-yellow-400" /> Escrow Payments
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="w-4 h-4 text-secondary" /> Real-Time GPS
              </div>
            </div>
          </div>

          {/* Live widget */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                <span className="font-heading text-lg font-semibold text-white">Platform Activity</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ color: "#4fdbcc", backgroundColor: "rgba(79,219,204,0.15)", borderColor: "rgba(79,219,204,0.3)" }}>
                  LIVE
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <StatPill loading={statsLoading} value={`${stats?.active_loads ?? "—"}`}    label="Open Loads" />
                <StatPill loading={statsLoading} value={`${stats?.active_drivers ?? "—"}`}  label="Avail. Drivers" />
                <StatPill loading={statsLoading} value={`${stats?.active_shipments ?? "—"}`} label="In Transit" />
              </div>
              <div className="space-y-3">
                <ShipmentRow id="TKV-7821A" origin="Nairobi, KE" dest="Mombasa, KE"  status="moving" accent />
                <ShipmentRow id="TKV-6634B" origin="Kampala, UG" dest="Nairobi, KE"  status="done" />
                <ShipmentRow id="TKV-5509C" origin="Nairobi, KE" dest="Arusha, TZ"   status="moving" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-slate-500">
                <span>{stats?.completed_shipments ?? "—"} deliveries completed</span>
                <span>{stats?.corridors_served ?? "—"} corridors active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform stats bar ───────────────────────────────────────────── */}
      <section className="bg-slate-900 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: statsLoading ? null : `${stats?.total_carriers ?? 0}+`, label: "Verified Carriers" },
            { value: statsLoading ? null : `${stats?.total_trucks ?? 0}+`,   label: "Active Trucks" },
            { value: statsLoading ? null : `${stats?.corridors_served ?? 0}`, label: "Corridors Served" },
            { value: "KES",                                                    label: "Native Currency" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-heading text-2xl md:text-3xl font-black text-white">
                {value == null
                  ? <span className="inline-block w-10 h-7 bg-slate-800 rounded animate-pulse" />
                  : value}
              </p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is trakvora for ──────────────────────────────────────────── */}
      <section className="py-24 bg-surface px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-primary mb-4">
              Built for Every Player in the Chain
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Whether you move cargo, own a fleet, or drive a truck — trakvora gives you the tools to operate at full efficiency.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              icon={Package}
              title="Shippers"
              color="text-white"
              bg="bg-primary"
              points={[
                "Post loads in under 2 minutes",
                "Receive competitive bids from vetted carriers",
                "Track shipments in real-time on a map",
                "Release escrow only on confirmed delivery",
                "Full shipment history and reporting",
              ]}
              cta="Post your first load"
              to="/register?role=shipper"
            />
            <RoleCard
              icon={Truck}
              title="Fleet Owners"
              color="text-white"
              bg="bg-[#1a3a5c]"
              points={[
                "List your fleet and get matched to loads",
                "Assign drivers and monitor every truck",
                "Bid on auction or fixed-price loads",
                "Receive payouts directly to your wallet",
                "Access consignment notes and documents",
              ]}
              cta="Register your fleet"
              to="/register?role=owner"
            />
            <RoleCard
              icon={Users}
              title="Drivers"
              color="text-white"
              bg="bg-secondary"
              points={[
                "Browse available loads on the job feed",
                "Set your availability and preferred routes",
                "Accept jobs and update status on the go",
                "Earn and track KES in your wallet",
                "Build your verified profile and ratings",
              ]}
              cta="Create driver profile"
              to="/register?role=driver"
            />
          </div>
          <div className="text-center mt-8">
            <Link to="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:opacity-80 transition-opacity">
              See how the full workflow works <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features bento ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-primary mb-4">
              Engineered for Logistics Control
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Every feature is purpose-built for East African freight — not adapted from a Western template.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard wide icon={<Compass className="w-6 h-6 text-white" />} iconBg="bg-primary" title="Real-Time Precision Tracking">
              Monitor every truck with GPS accuracy. Live updates, ETA predictions, and instant delay notifications ensure you're always in command — whether cargo is leaving Nairobi or crossing into Uganda.
            </FeatureCard>
            <FeatureCard icon={<CreditCard className="w-6 h-6 text-secondary" />} iconBg="bg-secondary/10" title="Escrow-Backed Payments">
              Shippers lock funds in escrow before dispatch. Carriers receive payment the moment delivery is confirmed. No chasing invoices, no payment disputes.
            </FeatureCard>
            <FeatureCard icon={<Network className="w-6 h-6" style={{ color: "#4fdbcc" }} />} iconBg="bg-teal-50" title="Vetted Carrier Network">
              Every driver and fleet owner is NTSA-verified and rated. You see real ratings, real trip histories, and real documents — not just profile pictures.
            </FeatureCard>
            <FeatureCard wide icon={<BarChart2 className="w-6 h-6 text-slate-600" />} iconBg="bg-slate-100" title="Actionable Data Dashboards">
              <div className="flex items-end gap-6">
                <p className="text-slate-600 max-w-md flex-1">
                  High-density dashboards built for rapid decision-making. Surface critical lane metrics, bid histories, and delivery performance without noise.
                </p>
                <div className="hidden md:flex w-36 h-20 bg-slate-50 rounded-lg border border-slate-200 items-end gap-1 p-3 shrink-0">
                  {[33, 66, 50, 100, 75, 83, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-secondary rounded-t-sm transition-all" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </FeatureCard>
            <FeatureCard icon={<Shield className="w-6 h-6 text-primary" />} iconBg="bg-blue-50" title="Compliance & Documents">
              Auto-generated consignment notes, NTSA verification, and a document vault for licences, PSV badges, and police clearances. Stay audit-ready.
            </FeatureCard>
            <FeatureCard icon={<Route className="w-6 h-6 text-purple-600" />} iconBg="bg-purple-50" title="Return Load Matching">
              Drivers post their empty-leg windows and get matched to backhaul loads automatically — eliminating dead miles and maximising revenue per trip.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ── Corridors trust strip ────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold font-heading text-slate-400 uppercase tracking-widest mb-10 text-center">
            Active freight corridors
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CORRIDORS.map(({ short, full, km }) => (
              <div key={short}
                className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-secondary/50 hover:shadow-sm transition-all cursor-default group">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <MapPin className="w-3 h-3 text-secondary" />
                  <span className="font-heading text-sm font-bold text-slate-800 group-hover:text-secondary transition-colors">{short}</span>
                </div>
                <p className="text-[10px] text-slate-400">{km}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-primary px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Start Moving Freight Today
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            No setup fees. No subscription required to join. Pay only on successful deliveries.
          </p>
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={dashboardTo}
                className="bg-secondary text-white px-10 py-4 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity shadow-lg">
                Open Dashboard
              </Link>
              <Link to="/how-it-works"
                className="border border-white/20 text-white px-10 py-4 rounded-xl font-heading font-semibold hover:bg-white/10 transition-colors">
                Explore Features
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="bg-secondary text-white px-10 py-4 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity shadow-lg">
                Get Started Free
              </Link>
              <Link to="/pricing"
                className="border border-white/20 text-white px-10 py-4 rounded-xl font-heading font-semibold hover:bg-white/10 transition-colors">
                View Pricing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <LogoFull iconSize={30} variant="dark" />
            <p className="text-slate-400 text-xs mt-3 leading-relaxed max-w-[200px]">
              East Africa's precision freight exchange. Nairobi · Mombasa · Kampala · Dar es Salaam.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold font-heading text-slate-500 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                { label: "How It Works",  to: "/how-it-works" },
                { label: "Pricing",       to: "/pricing" },
                { label: "For Shippers",  to: "/register?role=shipper" },
                { label: "For Drivers",   to: "/register?role=driver" },
              ].map(({ label, to }) => (
                <li key={label}><Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold font-heading text-slate-500 uppercase tracking-widest mb-4">Support</p>
            <ul className="space-y-2.5">
              {[
                { label: "Help Center",       to: "/help" },
                { label: "Carrier Agreement", to: "/carrier-agreement" },
                { label: "Contact Us",        to: "/help#contact" },
              ].map(({ label, to }) => (
                <li key={label}><Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold font-heading text-slate-500 uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-2.5">
              {[
                { label: "Terms of Service",  to: "/terms" },
                { label: "Privacy Policy",    to: "/privacy" },
                { label: "Carrier Agreement", to: "/carrier-agreement" },
              ].map(({ label, to }) => (
                <li key={label}><Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">© 2026 trakvora Technologies Ltd. All rights reserved.</p>
            <p className="text-xs text-slate-600">Governed by the laws of Kenya · Nairobi, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
