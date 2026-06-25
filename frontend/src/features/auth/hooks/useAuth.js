import { useMutation } from "@tanstack/react-query";
import { registerParentStudent, login } from "../api/authApi.js";

export const useRegisterParentStudent = () => {
  return useMutation({
    mutationFn: registerParentStudent,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
