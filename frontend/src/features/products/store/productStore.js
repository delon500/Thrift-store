import { create } from "zustand";

export const useProductStore = create((set) => ({
  products: [],
  currency: "R",

  searchQuery: "",

  setProducts: (products) =>
    set({
      products: products,
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
    }),
}));
