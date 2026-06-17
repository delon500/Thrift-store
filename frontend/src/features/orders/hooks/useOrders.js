import { useMutation, useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getMyOrder, getMyOrders, resumeOrderPayment } from "../api/ordersApi";

// Statuses where the order has reached a final outcome — stop polling.
const TERMINAL_STATUSES = [
  "ready_for_collection",
  "paid",
  "collected",
  "cancelled",
  "expired",
  "payment_failed",
];

export const useMyOrders = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["orders"],
    queryFn: () => getMyOrders(token),
    enabled: !!token,
  });
};

export const useResumeOrder = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (orderReference) => resumeOrderPayment({ orderReference, token }),
  });
};

// Polls a single order's status until it reaches a terminal state. Used after
// returning from PayFast so the UI reflects the ITN result without a refresh.
export const useOrderStatus = (orderReference, enabled = true) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["order-status", orderReference],
    queryFn: () => getMyOrder({ orderReference, token }),
    enabled: !!token && !!orderReference && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 2500;
    },
  });
};
