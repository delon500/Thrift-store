import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getOrder, getOrders } from "../api/ordersApi";

export const useOrders = (params) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-orders", params],
    queryFn: () => getOrders({ token, ...params }),
    enabled: !!token,
  });
};

export const useOrder = (orderReference) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-order", orderReference],
    queryFn: () => getOrder({ token, orderReference }),
    enabled: !!token && !!orderReference,
  });
};
