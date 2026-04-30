import { useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Truck, Store, FileText, Layers,
  HelpCircle, Settings, LogOut, Search, PackagePlus,
  Home, List, User, Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { LogoIcon, LogoWordmark } from "@/components/ui/Logo";
import { ToastContainer } from "@/components/ui/Toast";
import NotificationPanel from "@/components/ui/NotificationPanel";
import InboxIcon from "@/components/ui/InboxIcon";
import { useNotificationStore } from "@/store/notificationStore";

const NAV_TOP = [
  { to: "/owner", end: true,       icon: LayoutDashboard, label: "Dashboard"        },
  { to: "/owner/loads",            icon: Truck,           label: "Active Loads"      },
  { to: "/owner/marketplace",      icon: Store,           label: "Marketplace"       },
  { to: "/owner/fleet",            icon: Layers,          label: "Fleet Management"  },
  { to: "/owner/drivers",          icon: Users,           label: "My Drivers"        },
  { to: "/owner/documents",        icon: FileText,        label: "Documents"         },
  { to: "/owner/support",          icon: HelpCircle,      label: "Support"           },
];

const NAV_BOTTOM = [
  { to: "/owner/settings", icon: Settings, label: "Settings" },
];

function SideNavLink({ to, end, icon: Icon, label }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        isActive
          ? "flex items-center gap-3 bg-slate-800 text-secondary border-l-4 border-secondary px-4 py-3 text-[11px] font-semibold uppercase tracking-widest font-heading"
          : "flex items-center gap-3 text-slate-400 px-4 py-3 hover:bg-slate-800 hover:text-white transition-colors text-[11px] font-semibold uppercase tracking-widest font-heading"
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function OwnerLayout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);

  useEffect(() => { fetchNotifications(); }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "O";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ── */}
      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r border-slate-800 bg-slate-900 flex-col py-6 z-50">
        <Link to="/" className="px-6 mb-8 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <LogoIcon size={32} variant="dark" />
          <div>
            <h1 className="text-xl font-black text-white font-heading tracking-tight leading-none">trakvora</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Fleet Control</p>
          </div>
        </Link>

        <div className="px-4 mb-6">
          <Link to="/owner/fleet"
            className="w-full flex items-center justify-center gap-2 bg-secondary hover:opacity-90 text-white py-3 rounded-lg text-[11px] font-semibold uppercase tracking-widest transition-opacity shadow-[0_4px_12px_rgba(254,106,52,0.3)]"
          >
            <PackagePlus className="w-4 h-4" />
            Dispatch Unit
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul>
            {NAV_TOP.map((link) => (
              <li key={link.to}><SideNavLink {...link} /></li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          <ul>
            {NAV_BOTTOM.map((link) => (
              <li key={link.to}><SideNavLink {...link} /></li>
            ))}
            <li>
              <button onClick={() => { clearAuth(); navigate("/login"); }}
                className="w-full flex items-center gap-3 text-slate-400 px-4 py-3 hover:bg-slate-800 hover:text-white transition-colors text-[11px] font-semibold uppercase tracking-widest font-heading">
                <LogOut className="w-4 h-4 shrink-0" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Mobile Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoIcon size={26} />
          <LogoWordmark size="lg" />
        </Link>
        <div className="flex items-center gap-1">
          <InboxIcon to="/owner/inbox" variant="light" />
          <NotificationPanel variant="light" />
          <Link to="/owner/settings">
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[10px] font-bold text-slate-600 font-heading">{initials}</span>}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Desktop Header ── */}
      <header className="hidden md:flex justify-between items-center fixed top-0 left-64 right-0 z-40 px-8 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search trucks, loads..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors" />
          </div>
          <nav className="flex items-center gap-1">
            {[
              { to: "/owner/marketplace", label: "Marketplace" },
              { to: "/owner/loads",       label: "Shipments"   },
              { to: "/owner/fleet",       label: "Fleet"       },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  isActive
                    ? "text-xs font-semibold font-heading text-secondary border-b-2 border-secondary px-3 py-1 transition-colors"
                    : "text-xs font-semibold font-heading text-slate-500 hover:text-slate-800 px-3 py-1 rounded transition-colors hover:bg-slate-50"
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <InboxIcon to="/owner/inbox" variant="light" />
          <NotificationPanel variant="light" />
          <Link to="/owner/fleet"
            className="bg-secondary text-white px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity">
            Ship Now
          </Link>
          <Link to="/owner/settings">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 shrink-0 hover:ring-2 hover:ring-secondary/30 transition-all cursor-pointer overflow-hidden flex items-center justify-center">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-slate-600 font-heading">{initials}</span>}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-[72px] pb-24 md:pb-12 px-4 md:px-8 w-full min-h-screen">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-4 z-50 border-t rounded-t-xl bg-white border-slate-200 shadow-[0_-4px_20px_rgba(26,43,60,0.08)]">
        {[
          { to: "/owner",           end: true, icon: Home,        label: "Home"    },
          { to: "/owner/loads",               icon: List,        label: "Loads"   },
          { to: "/owner/fleet",               icon: Truck,       label: "Fleet"   },
          { to: "/owner/marketplace",         icon: Store,       label: "Market"  },
        ].map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-bold font-heading uppercase ${isActive ? "text-secondary" : "text-slate-400"}`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <ToastContainer />
    </div>
  );
}
