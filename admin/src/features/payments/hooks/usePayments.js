import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getPayment, getPayments, recoverPayment } from "../api/paymentsApi";

export const usePayments = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-payments", params],
    queryFn: () => getPayments({ token, params }),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
};

export const usePayment = (id) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-payment", id],
    queryFn: () => getPayment({ id, token }),
    enabled: !!token && !!id,
  });
};

export const useRecoverPayment = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderReference) => recoverPayment({ orderReference, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });
};
