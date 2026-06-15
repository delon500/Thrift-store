import { create } from "zustand";

const storedUser = localStorage.getItem("school_user");

const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem("school_token"),

  setAuth: (data) => {
    localStorage.setItem("school_token", data.token);
    localStorage.setItem("school_user", JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_user");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
