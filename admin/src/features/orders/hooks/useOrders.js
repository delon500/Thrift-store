import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  cancelOrder,
  getOrder,
  getOrders,
  markOrderCollected,
  refundOrder,
} from "../api/orderApi";

export const useOrders = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => getOrders({ token, params }),
    enabled: !!token,
    placeholderData: (previous) => previous,
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

const useOrderAction = (action) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (orderReference) => action({ orderReference, token }),
    onSuccess: (_data, orderReference) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderReference] });
    },
  });
};

export const useMarkOrderCollected = () => useOrderAction(markOrderCollected);
export const useCancelOrder = () => useOrderAction(cancelOrder);
export const useRefundOrder = () => useOrderAction(refundOrder);
