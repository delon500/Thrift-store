import { useMutation, useQuery } from "@tanstack/react-query";
import { getMe, login } from "../api/authApi";
import useAuthStore from "../store/authStore";

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};

export const useMe = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
    enabled: !!token,
  });
};
