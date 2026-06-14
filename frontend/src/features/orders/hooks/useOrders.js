import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getMyOrders } from "../api/ordersApi";

export const useMyOrders = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["orders"],
    queryFn: () => getMyOrders(token),
    enabled: !!token,
  });
};
