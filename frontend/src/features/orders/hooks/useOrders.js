import { useMutation, useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getMyOrders, resumeOrderPayment } from "../api/ordersApi";

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
