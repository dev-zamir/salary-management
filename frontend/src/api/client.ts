import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Global error interceptor: surfaces network errors and unexpected
// server errors so the user knows something went wrong, without
// swallowing the error (re-throws for per-call handling).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (API unreachable, CORS blocked, etc.)
      console.error("[API] Network error:", error.message);
    } else if (error.response.status >= 500) {
      console.error("[API] Server error:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
