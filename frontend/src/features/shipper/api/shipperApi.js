import apiClient from "@/services/apiClient";

export const shipperApi = {
  createLoad: (data) => apiClient.post("/loads", data).then((r) => r.data),
  myLoads: () => apiClient.get("/loads/marketplace").then((r) => r.data),
  getLoad: (id) => apiClient.get(`/loads/${id}`).then((r) => r.data),
  cancelLoad: (id) => apiClient.delete(`/loads/${id}`).then((r) => r.data),

  getBids: (loadId) => apiClient.get(`/bids/load/${loadId}`).then((r) => r.data),
  acceptBid: (bidId) => apiClient.patch(`/bids/${bidId}/accept`).then((r) => r.data),

  getShipment: (id) => apiClient.get(`/shipments/${id}`).then((r) => r.data),
};
