import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistItems: [],

      addToWishlist: (product) => {
        const exists = get().wishlistItems.some(
          (item) => item.id === product.id,
        );
        if (exists) return;

        set((state) => ({
          wishlistItems: [...state.wishlistItems, product],
        }));
      },

      removeFromWishlist: (id) => {
        set((state) => ({
          wishlistItems: state.wishlistItems.filter((item) => item.id !== id),
        }));
      },

      clearWishlist: () => set({ wishlistItems: [] }),
    }),
    {
      name: "wishlist-storage",
    },
  ),
);
