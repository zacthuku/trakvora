import apiClient from "@/services/apiClient";

export const driverApi = {
  getMarketplace: (params) =>
    apiClient.get("/loads/marketplace", { params }).then((r) => r.data),
  getShipment: (id) => apiClient.get(`/shipments/${id}`).then((r) => r.data),
  updateStatus: (id, data) =>
    apiClient.patch(`/shipments/${id}/status`, data).then((r) => r.data),
  updateLocation: (id, data) =>
    apiClient.patch(`/shipments/${id}/location`, data).then((r) => r.data),
  getWallet: () => apiClient.get("/payments/wallet").then((r) => r.data),
  getTransactions: (params) =>
    apiClient.get("/payments/transactions", { params }).then((r) => r.data),
};
