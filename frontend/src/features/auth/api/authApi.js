import apiClient from "@/services/apiClient";

export const authApi = {
  register: (data) => apiClient.post("/auth/register", data).then((r) => r.data),
  login: (data) => apiClient.post("/auth/login", data).then((r) => r.data),
  sendOtp: (email, channel) =>
    apiClient.post("/auth/send-otp", { email, channel }).then((r) => r.data),
  verifyOtp: (data) => apiClient.post("/auth/verify-otp", data).then((r) => r.data),
  resendOtp: (email) => apiClient.post("/auth/resend-otp", { email }),
  refresh: (refreshToken) =>
    apiClient.post("/auth/refresh", { refresh_token: refreshToken }).then((r) => r.data),
  me: () => apiClient.get("/users/me").then((r) => r.data),
  googleAuth: (accessToken, role = null) =>
    apiClient.post("/auth/google", { access_token: accessToken, role }).then((r) => r.data),
};
