import { useMutation } from "@tanstack/react-query";
import { login } from "../api/authApi";

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
