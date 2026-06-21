import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getSchoolProducts } from "../api/inventoryApi";

export const useInventory = (params) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-products", params],
    queryFn: () => getSchoolProducts({ token, ...params }),
    enabled: !!token,
  });
};
