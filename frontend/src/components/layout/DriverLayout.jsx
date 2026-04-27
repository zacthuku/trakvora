import { Outlet } from "react-router-dom";
import { LayoutDashboard, Briefcase, MapPin, Wallet } from "lucide-react";
import Sidebar from "./Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

const LINKS = [
  { to: "/driver", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/driver/jobs", icon: Briefcase, label: "Job Feed" },
  { to: "/driver/active", icon: MapPin, label: "Active Job" },
  { to: "/driver/earnings", icon: Wallet, label: "Earnings" },
];

export default function DriverLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar links={LINKS} />
      <main className="flex-1 p-6 bg-surface overflow-y-auto">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
