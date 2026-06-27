import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  getReadyOrders,
  lookupReference,
  markCollected,
} from "../api/collectionsApi";

export const useReadyOrders = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["school-ready-orders"],
    queryFn: () => getReadyOrders(token),
    enabled: !!token,
  });
};

export const useLookup = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (reference) => lookupReference({ reference, token }),
  });
};

export const useMarkCollected = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderReference) => markCollected({ orderReference, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-ready-orders"] });
      queryClient.invalidateQueries({ queryKey: ["school-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["school-orders"] });
      queryClient.invalidateQueries({ queryKey: ["school-order"] });
    },
  });
};
