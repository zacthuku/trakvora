import apiClient from "@/services/apiClient";

export const adminApi = {
  getDashboard: () => apiClient.get("/admin/dashboard").then((r) => r.data),

  // Users
  getUsers: (params) => apiClient.get("/admin/users", { params }).then((r) => r.data),
  suspendUser: (id) => apiClient.patch(`/admin/users/${id}/suspend`).then((r) => r.data),
  verifyUser: (id) => apiClient.patch(`/admin/users/${id}/verify`).then((r) => r.data),

  // Drivers
  getDrivers: (params) => apiClient.get("/admin/drivers", { params }).then((r) => r.data),
  updateDriverVerification: (id, status) =>
    apiClient.patch(`/admin/drivers/${id}/verification`, { status }).then((r) => r.data),

  // Loads
  getLoads: (params) => apiClient.get("/admin/loads", { params }).then((r) => r.data),
  cancelLoad: (id) => apiClient.patch(`/admin/loads/${id}/cancel`).then((r) => r.data),

  // Shipments
  getShipments: (params) => apiClient.get("/admin/shipments", { params }).then((r) => r.data),
  resolveDispute: (id) => apiClient.patch(`/admin/shipments/${id}/resolve-dispute`).then((r) => r.data),

  // Transactions
  getTransactions: (params) => apiClient.get("/admin/transactions", { params }).then((r) => r.data),

  // Trucks
  getTrucks: (params) => apiClient.get("/admin/trucks", { params }).then((r) => r.data),
  toggleTruckActive: (id) => apiClient.patch(`/admin/trucks/${id}/toggle-active`).then((r) => r.data),
};
