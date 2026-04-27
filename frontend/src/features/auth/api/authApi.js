import apiClient from "@/services/apiClient";

export const authApi = {
  register: (data) => apiClient.post("/auth/register", data).then((r) => r.data),
  login: (data) => apiClient.post("/auth/login", data).then((r) => r.data),
  refresh: (refreshToken) =>
    apiClient.post("/auth/refresh", { refresh_token: refreshToken }).then((r) => r.data),
  me: () => apiClient.get("/users/me").then((r) => r.data),
};
