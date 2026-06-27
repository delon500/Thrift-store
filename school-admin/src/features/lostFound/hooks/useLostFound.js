import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  reportFound,
  getFoundReports,
  markReturned,
  listForResale,
} from "../api/lostFoundApi";

export const useFoundReports = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["found-reports"],
    queryFn: () => getFoundReports(token),
    enabled: !!token,
  });
};

export const useReportFound = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value) => reportFound({ value, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["found-reports"] }),
  });
};

export const useMarkReturned = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => markReturned({ id, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["found-reports"] }),
  });
};

export const useListForResale = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => listForResale({ id, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["found-reports"] }),
  });
};
