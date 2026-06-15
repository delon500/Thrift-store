import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getLogs, getStats } from "../api/dashboardApi";

export const useStats = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getStats(token),
    enabled: !!token,
  });
};

export const useLogs = (limit = 15) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-logs", limit],
    queryFn: () => getLogs({ token, limit }),
    enabled: !!token,
  });
};
