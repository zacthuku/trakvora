import apiClient from "@/services/apiClient";

export const loadsApi = {
  getMarketplace: (params) =>
    apiClient.get("/loads/marketplace", { params }).then((r) => r.data),
  getLoad: (id) => apiClient.get(`/loads/${id}`).then((r) => r.data),
  placeBid: (data) => apiClient.post("/bids", data).then((r) => r.data),
  getMyTrucks: () => apiClient.get("/trucks").then((r) => r.data),
};
