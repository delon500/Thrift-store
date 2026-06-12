import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (data) =>
        set({
          user: data.user,
          token: data.token,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);

export default useAuthStore;
