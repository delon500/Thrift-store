import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { changePassword, updateMe } from "../api/accountApi";

export const useUpdateMe = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => updateMe({ updates, token }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Keep the navbar/sidebar name in sync with the saved profile.
      if (user) setUser(user);
    },
  });
};

export const useChangePassword = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (payload) => changePassword({ payload, token }),
  });
};
