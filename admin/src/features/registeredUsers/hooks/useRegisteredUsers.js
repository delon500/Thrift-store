import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  deleteUser,
  getUsersByRole,
  resetUserPassword,
  updateUser,
} from "../api/registeredUsersApi";

export const useUsersByRole = (role, params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-users", role, params],
    queryFn: () => getUsersByRole({ role, token, params }),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
};

export const useUpdateUser = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateUser({ id, updates, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useResetUserPassword = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: ({ id, newPassword }) =>
      resetUserPassword({ id, newPassword, token }),
  });
};

export const useDeleteUser = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteUser({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};
