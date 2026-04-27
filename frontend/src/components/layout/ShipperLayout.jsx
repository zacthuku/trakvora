import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  PackagePlus,
  Truck,
  History,
  Wallet,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

const LINKS = [
  { to: "/shipper", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/shipper/post-load", icon: PackagePlus, label: "Post a Load" },
  { to: "/shipper/shipments", icon: Truck, label: "Active Shipments" },
  { to: "/shipper/history", icon: History, label: "History" },
  { to: "/shipper/wallet", icon: Wallet, label: "Wallet" },
];

export default function ShipperLayout() {
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
