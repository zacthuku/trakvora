import { Navigate, Route, Routes } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/features/landing/LandingPage";
import PublicLayout from "@/components/layout/PublicLayout";
import AuthLayout from "@/components/layout/AuthLayout";

import HowItWorksPage     from "@/features/landing/pages/HowItWorksPage";
import PricingPage        from "@/features/landing/pages/PricingPage";
import HelpCenterPage     from "@/features/landing/pages/HelpCenterPage";
import TermsPage          from "@/features/landing/pages/TermsPage";
import PrivacyPage        from "@/features/landing/pages/PrivacyPage";
import CarrierAgreementPage from "@/features/landing/pages/CarrierAgreementPage";
import ShipperLayout from "@/components/layout/ShipperLayout";
import DriverLayout from "@/components/layout/DriverLayout";
import OwnerLayout from "@/components/layout/OwnerLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import AdminUsersPage from "@/features/admin/pages/AdminUsersPage";
import AdminDriversPage from "@/features/admin/pages/AdminDriversPage";
import AdminLoadsPage from "@/features/admin/pages/AdminLoadsPage";
import AdminShipmentsPage from "@/features/admin/pages/AdminShipmentsPage";
import AdminWalletsPage from "@/features/admin/pages/AdminWalletsPage";
import AdminTrucksPage from "@/features/admin/pages/AdminTrucksPage";

import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

import ShipperDashboard from "@/features/shipper/pages/ShipperDashboard";
import ShipperTrackingPage from "@/features/shipper/pages/ShipperTrackingPage";
import ShipperSupportPage from "@/features/shipper/pages/ShipperSupportPage";
import ShipperSettingsPage from "@/features/shipper/pages/ShipperSettingsPage";
import PostLoadPage from "@/features/shipper/pages/PostLoadPage";
import ActiveShipmentsPage from "@/features/shipper/pages/ActiveShipmentsPage";
import BidComparisonPage from "@/features/shipper/pages/BidComparisonPage";
import ShipmentHistoryPage from "@/features/shipper/pages/ShipmentHistoryPage";

import DriverDashboard from "@/features/driver/pages/DriverDashboard";
import JobFeedPage from "@/features/driver/pages/JobFeedPage";
import ActiveJobPage from "@/features/driver/pages/ActiveJobPage";
import EarningsWalletPage from "@/features/driver/pages/EarningsWalletPage";
import DriverSettingsPage from "@/features/driver/pages/DriverSettingsPage";
import DriverSupportPage from "@/features/driver/pages/DriverSupportPage";
import DriverProfilePage from "@/features/driver/pages/DriverProfilePage";
import DriverPublicProfilePage from "@/features/driver/pages/DriverPublicProfilePage";

import LoadMarketplacePage from "@/features/loads/pages/LoadMarketplacePage";
import LoadDetailPage from "@/features/loads/pages/LoadDetailPage";

import OwnerDashboard from "@/features/owner/pages/OwnerDashboard";
import FleetManagementPage from "@/features/owner/pages/FleetManagementPage";
import OwnerActiveLoadsPage from "@/features/owner/pages/OwnerActiveLoadsPage";
import DocumentsPage from "@/features/owner/pages/DocumentsPage";
import OwnerSupportPage from "@/features/owner/pages/SupportPage";
import OwnerSettingsPage from "@/features/owner/pages/SettingsPage";
import OwnerDriversPage from "@/features/owner/pages/OwnerDriversPage";
import InboxPage from "@/features/shared/pages/InboxPage";

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
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Public marketing pages — shared header + footer */}
      <Route element={<PublicLayout />}>
        <Route path="/how-it-works"     element={<HowItWorksPage />} />
        <Route path="/pricing"          element={<PricingPage />} />
        <Route path="/help"             element={<HelpCenterPage />} />
        <Route path="/terms"            element={<TermsPage />} />
        <Route path="/privacy"          element={<PrivacyPage />} />
        <Route path="/carrier-agreement" element={<CarrierAgreementPage />} />
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
        <Route path="tracking" element={<ShipperTrackingPage />} />
        <Route path="history" element={<ShipmentHistoryPage />} />
        <Route path="support" element={<ShipperSupportPage />} />
        <Route path="settings" element={<ShipperSettingsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="inbox" element={<InboxPage />} />
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
        <Route path="support" element={<DriverSupportPage />} />
        <Route path="settings" element={<DriverSettingsPage />} />
        <Route path="profile" element={<DriverProfilePage />} />
        <Route path="inbox" element={<InboxPage />} />
      </Route>

      <Route
        path="/owner"
        element={
          <RoleGuard allowedRoles={["owner"]}>
            <OwnerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<OwnerDashboard />} />
        <Route path="fleet" element={<FleetManagementPage />} />
        <Route path="drivers" element={<OwnerDriversPage />} />
        <Route path="loads" element={<OwnerActiveLoadsPage />} />
        <Route path="loads/:loadId" element={<LoadDetailPage />} />
        <Route path="marketplace" element={<LoadMarketplacePage />} />
        <Route path="marketplace/:loadId" element={<LoadDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="support" element={<OwnerSupportPage />} />
        <Route path="settings" element={<OwnerSettingsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="inbox" element={<InboxPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="drivers" element={<AdminDriversPage />} />
        <Route path="loads" element={<AdminLoadsPage />} />
        <Route path="shipments" element={<AdminShipmentsPage />} />
        <Route path="wallets" element={<AdminWalletsPage />} />
        <Route path="trucks" element={<AdminTrucksPage />} />
        <Route path="inbox" element={<InboxPage />} />
      </Route>

      <Route
        path="/driver-profile/:userId"
        element={
          <AuthGuard>
            <DriverPublicProfilePage />
          </AuthGuard>
        }
      />

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
