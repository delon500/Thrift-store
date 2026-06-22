import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getProducts } from "../api/productApi";

export const useGetProducts = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(token),
    enabled: !!token,
  });
};
