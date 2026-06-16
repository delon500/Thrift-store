import axios from "axios";
import useAuthStore from "../features/auth/store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// If an authenticated request comes back 401, the token is invalid/expired —
// clear the session and bounce to the login screen. We only act when a token
// exists so a failed login attempt isn't treated as an expired session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
