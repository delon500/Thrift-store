import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  deleteProduct,
  getAdminProducts,
  updateProduct,
} from "../api/inventoryApi";

export const useInventory = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => getAdminProducts({ token, params }),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
};

export const useUpdateProduct = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateProduct({ id, updates, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteProduct({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};
