import { Outlet } from "react-router-dom";
import { Store, Truck, Wallet } from "lucide-react";
import Sidebar from "./Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

const LINKS = [
  { to: "/owner", icon: Store, label: "Marketplace" },
  { to: "/owner/wallet", icon: Wallet, label: "Wallet" },
];

export default function OwnerLayout() {
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
