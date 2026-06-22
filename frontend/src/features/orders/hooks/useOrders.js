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

// Single order for the detail page. Polls while not yet in a terminal state so
// a still-pending order updates live (e.g. once the PayFast ITN lands).
export const useMyOrder = (orderReference) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["order", orderReference],
    queryFn: () => getMyOrder({ orderReference, token }),
    enabled: !!token && !!orderReference,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 4000;
    },
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
