import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getDashboard } from "../api/dashboardApi";

export const useDashboard = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-dashboard"],
    queryFn: () => getDashboard(token),
    enabled: !!token,
  });
};
