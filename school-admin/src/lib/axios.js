import axios from "axios";
import useAuthStore from "../features/auth/store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// On a 401 for an authenticated request, the token is expired/invalid — clear
// the session and return to login. Guarded by an existing token so a failed
// login attempt isn't treated as an expired session.
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
