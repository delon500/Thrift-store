import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  cancelCheckout,
  createCheckout,
  getPaymentMethods,
} from "../api/checkoutApi";

export const usePaymentMethods = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => getPaymentMethods(token),
    enabled: !!token,
  });
};

export const useCreateCheckout = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => createCheckout({ formData, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useCancelCheckout = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderReference) => cancelCheckout({ orderReference, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
