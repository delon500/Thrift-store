import { useMutation } from "@tanstack/react-query";
import { analyzeProduct, createProduct } from "../api/productApi";

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: createProduct,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};

export const useAnalyzeProduct = () => {
  return useMutation({
    mutationFn: analyzeProduct,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};
