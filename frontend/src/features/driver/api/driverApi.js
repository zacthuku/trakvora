import apiClient from "@/services/apiClient";

export const driverApi = {
  // Marketplace / loads
  getMarketplace: (params) =>
    apiClient.get("/loads/marketplace", { params }).then((r) => r.data),

  // Shipment actions
  getShipment: (id) => apiClient.get(`/shipments/${id}`).then((r) => r.data),
  updateStatus: (id, data) =>
    apiClient.patch(`/shipments/${id}/status`, data).then((r) => r.data),
  updateLocation: (id, data) =>
    apiClient.patch(`/shipments/${id}/location`, data).then((r) => r.data),

  // Wallet / payments
  getWallet: () => apiClient.get("/payments/wallet").then((r) => r.data),
  getTransactions: (params) =>
    apiClient.get("/payments/transactions", { params }).then((r) => r.data),

  // Driver profile
  getProfile: () => apiClient.get("/drivers/me").then((r) => r.data),
  createProfile: (data) => apiClient.post("/drivers/me", data).then((r) => r.data),
  updateProfile: (data) => apiClient.patch("/drivers/me", data).then((r) => r.data),
  updateAvailability: (data) =>
    apiClient.patch("/drivers/me/availability", data).then((r) => r.data),

  // Public driver lookups
  getAvailableDrivers: () => apiClient.get("/drivers/available").then((r) => r.data),
  getDriverByUserId: (userId) =>
    apiClient.get(`/drivers/by-user/${userId}`).then((r) => r.data),
  getDriverById: (driverId) =>
    apiClient.get(`/drivers/${driverId}`).then((r) => r.data),

  // Direct offer response
  respondToOffer: (loadId, accept, notificationId) =>
    apiClient.post(`/loads/${loadId}/offer-response`, {
      accept,
      notification_id: notificationId ?? null,
    }).then((r) => r.data),

  // Trucks
  getMyTrucks: () => apiClient.get("/trucks").then((r) => r.data),
  getAssignedTruck: () => apiClient.get("/trucks/assigned-to-me").then((r) => r.data),
  createTruck: (data) => apiClient.post("/trucks", data).then((r) => r.data),
  updateTruck: (id, data) =>
    apiClient.patch(`/trucks/${id}`, data).then((r) => r.data),
  assignDriver: (truckId, driverUserId) =>
    apiClient
      .patch(`/trucks/${truckId}/assign-driver`, { driver_user_id: driverUserId })
      .then((r) => r.data),
};
