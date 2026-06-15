import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { changePassword, updateMe } from "../api/accountApi";

export const useUpdateMe = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => updateMe({ updates, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useChangePassword = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (payload) => changePassword({ payload, token }),
  });
};
