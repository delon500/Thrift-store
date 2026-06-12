import { useMutation } from "@tanstack/react-query";
import {
  registerInstitution,
  registerParentStudent,
  login,
} from "../api/authApi.js";

export const useRegisterParentStudent = () => {
  return useMutation({
    mutationFn: registerParentStudent,
  });
};

export const useRegisterInstitution = () => {
  return useMutation({
    mutationFn: registerInstitution,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
