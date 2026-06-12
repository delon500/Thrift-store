import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  addCartItem,
  checkoutCart,
  clearCart,
  getCart,
  removeCartItem,
} from "../api/cartApi";

export const useServerCart = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(token),
    enabled: !!token,
  });
};

export const useAddCartItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (productId) => addCartItem({ productId, token }),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (cartItemId) => removeCartItem({ cartItemId, token }),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: () => clearCart(token),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
    },
  });
};

export const useCheckoutCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (collectionNote) => checkoutCart({ collectionNote, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
