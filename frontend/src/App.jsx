import { Navigate, Route, Routes } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";
import AuthLayout from "@/components/layout/AuthLayout";
import ShipperLayout from "@/components/layout/ShipperLayout";
import DriverLayout from "@/components/layout/DriverLayout";
import OwnerLayout from "@/components/layout/OwnerLayout";

import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

import ShipperDashboard from "@/features/shipper/pages/ShipperDashboard";
import PostLoadPage from "@/features/shipper/pages/PostLoadPage";
import ActiveShipmentsPage from "@/features/shipper/pages/ActiveShipmentsPage";
import BidComparisonPage from "@/features/shipper/pages/BidComparisonPage";
import ShipmentHistoryPage from "@/features/shipper/pages/ShipmentHistoryPage";

import DriverDashboard from "@/features/driver/pages/DriverDashboard";
import JobFeedPage from "@/features/driver/pages/JobFeedPage";
import ActiveJobPage from "@/features/driver/pages/ActiveJobPage";
import EarningsWalletPage from "@/features/driver/pages/EarningsWalletPage";

import LoadMarketplacePage from "@/features/loads/pages/LoadMarketplacePage";
import LoadDetailPage from "@/features/loads/pages/LoadDetailPage";

import TrackingPage from "@/features/tracking/pages/TrackingPage";
import WalletPage from "@/features/payments/pages/WalletPage";

function RoleGuard({ allowedRoles, children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AuthGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "shipper") return <Navigate to="/shipper" replace />;
  if (user.role === "driver") return <Navigate to="/driver" replace />;
  if (user.role === "owner") return <Navigate to="/owner" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/shipper"
        element={
          <RoleGuard allowedRoles={["shipper"]}>
            <ShipperLayout />
          </RoleGuard>
        }
      >
        <Route index element={<ShipperDashboard />} />
        <Route path="post-load" element={<PostLoadPage />} />
        <Route path="shipments" element={<ActiveShipmentsPage />} />
        <Route path="bids/:loadId" element={<BidComparisonPage />} />
        <Route path="history" element={<ShipmentHistoryPage />} />
        <Route path="wallet" element={<WalletPage />} />
      </Route>

      <Route
        path="/driver"
        element={
          <RoleGuard allowedRoles={["driver"]}>
            <DriverLayout />
          </RoleGuard>
        }
      >
        <Route index element={<DriverDashboard />} />
        <Route path="jobs" element={<JobFeedPage />} />
        <Route path="active" element={<ActiveJobPage />} />
        <Route path="earnings" element={<EarningsWalletPage />} />
      </Route>

      <Route
        path="/owner"
        element={
          <RoleGuard allowedRoles={["owner"]}>
            <OwnerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<LoadMarketplacePage />} />
        <Route path="loads/:loadId" element={<LoadDetailPage />} />
        <Route path="wallet" element={<WalletPage />} />
      </Route>

      <Route
        path="/track/:shipmentId"
        element={
          <AuthGuard>
            <TrackingPage />
          </AuthGuard>
        }
      />

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
