import { create } from "zustand";

export const useProductStore = create((set) => ({
  formData: {
    name: "",
    slug: "",
    description: "",
    gender: "",
    price: "",
    status: "Available",
    category: "",
    schoolId: "",
    age: "",
    condition: "Excellent",
    listing_type: "",
  },
  images: {
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  },

  setField: (field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    })),

  setImage: (key, file) =>
    set((state) => ({
      images: {
        ...state.images,
        [key]: file,
      },
    })),

  resetForm: () =>
    set({
      formData: {
        name: "",
        slug: "",
        description: "",
        gender: "",
        price: "",
        status: "Available",
        category: "",
        schoolId: "",
        age: "",
        condition: "Excellent",
        listing_type: "",
      },
      images: {
        image1: null,
        image2: null,
        image3: null,
        image4: null,
        image5: null,
      },
    }),
}));
