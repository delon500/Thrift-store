import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getOrder, getOrders, markOrderCollected } from "../api/orderApi";

export const useOrders = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getOrders(token),
    enabled: !!token,
  });
};

export const useOrder = (orderReference) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-order", orderReference],
    queryFn: () => getOrder({ orderReference, token }),
    enabled: !!token && !!orderReference,
  });
};

export const useMarkOrderCollected = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (orderReference) => markOrderCollected({ orderReference, token }),
    onSuccess: (_data, orderReference) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderReference] });
    },
  });
};
