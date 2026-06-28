import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  analyzeSchoolProduct,
  createSchoolProduct,
  deleteSchoolProduct,
  getSchoolProducts,
  lookupSticker,
  updateSchoolProduct,
} from "../api/inventoryApi";

export const useStickerLookup = (value) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["sticker", value],
    queryFn: () => lookupSticker({ value, token }),
    enabled: !!token && !!value,
    retry: false,
  });
};

export const useInventory = (params) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-products", params],
    queryFn: () => getSchoolProducts({ token, ...params }),
    enabled: !!token,
  });
};

export const useCreateSchoolProduct = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formData, images }) =>
      createSchoolProduct({ formData, images, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["school-products"] }),
  });
};

export const useAnalyzeSchoolProduct = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: ({ images }) => analyzeSchoolProduct({ images, token }),
  });
};

export const useUpdateSchoolProduct = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateSchoolProduct({ id, updates, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["school-products"] }),
  });
};

export const useDeleteSchoolProduct = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteSchoolProduct({ id, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["school-products"] }),
  });
};
