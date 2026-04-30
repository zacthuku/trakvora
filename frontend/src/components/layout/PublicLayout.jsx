import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Truck, ArrowRight } from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";

const NAV_LINKS = [
  { label: "How It Works", to: "/how-it-works" },
  { label: "Pricing",      to: "/pricing" },
  { label: "Help",         to: "/help" },
];

const FOOTER_PRODUCT = [
  { label: "How It Works",      to: "/how-it-works" },
  { label: "Pricing",           to: "/pricing" },
  { label: "Marketplace",       to: "/login" },
  { label: "Live Tracking",     to: "/login" },
];

const FOOTER_COMPANY = [
  { label: "About trakvora",    to: "/how-it-works" },
  { label: "Carrier Agreement", to: "/carrier-agreement" },
  { label: "Help Center",       to: "/help" },
  { label: "Contact Us",        to: "/help#contact" },
];

const FOOTER_LEGAL = [
  { label: "Terms of Service",  to: "/terms" },
  { label: "Privacy Policy",    to: "/privacy" },
  { label: "Carrier Agreement", to: "/carrier-agreement" },
  { label: "Cookie Policy",     to: "/privacy#cookies" },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled]  = useState(false);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardTo =
    user?.role === "shipper" ? "/shipper" :
    user?.role === "driver"  ? "/driver"  :
    user?.role === "owner"   ? "/owner"   : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      {/* ── Header ── */}
      <header className={`sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-shadow ${scrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo + desktop nav */}
          <div className="flex items-center gap-8">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <LogoFull iconSize={34} />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `font-heading text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                      isActive
                        ? "text-secondary bg-orange-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* CTA buttons */}
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
              className="btn-primary text-sm hidden md:flex items-center gap-1.5">
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

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to}
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
                <Link to={dashboardTo} className="btn-primary text-sm text-center">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login"    className="btn-outline text-sm text-center">Log in</Link>
                  <Link to="/register" className="btn-primary text-sm text-center">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-primary text-white">
        {/* Top CTA band */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-heading text-xl font-bold text-white">Ready to move freight smarter?</p>
              <p className="text-slate-400 text-sm mt-1">Join thousands of shippers, drivers, and owners on trakvora.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/register"
                className="bg-secondary text-white px-6 py-2.5 rounded-xl font-heading font-semibold text-sm hover:opacity-90 transition-opacity">
                Start for Free
              </Link>
              <Link to="/how-it-works"
                className="border border-white/20 text-white px-6 py-2.5 rounded-xl font-heading font-semibold text-sm hover:bg-white/10 transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <LogoFull iconSize={32} variant="dark" />
            <p className="text-slate-400 text-xs mt-3 leading-relaxed max-w-[200px]">
              East Africa's precision freight exchange. Nairobi · Mombasa · Kampala · Dar es Salaam.
            </p>
            <div className="flex gap-3 mt-4">
              {["NBO", "MSA", "KLA", "DAR"].map((city) => (
                <span key={city} className="text-[10px] font-bold font-heading text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                  {city}
                </span>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold font-heading text-slate-400 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-2.5">
              {FOOTER_PRODUCT.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold font-heading text-slate-400 uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5">
              {FOOTER_COMPANY.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold font-heading text-slate-400 uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-2.5">
              {FOOTER_LEGAL.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">© 2026 trakvora Technologies Ltd. All rights reserved.</p>
            <p className="text-xs text-slate-600">Governed by the laws of Kenya · Nairobi, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
