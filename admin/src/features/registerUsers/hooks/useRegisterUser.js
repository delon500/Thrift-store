import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  registerInstitution,
  registerParent,
  registerStaff,
  registerStudent,
} from "../api/registerUsers";

const toastError = (error) =>
  toast.error(error?.response?.data?.message || "Registration failed");

export const useRegisterStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerStaff,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: toastError,
  });
};

// The School/University pages own success + error feedback at the call site (so
// this hook stays neutral on error to avoid a duplicate toast); it still
// refreshes the institutions list on success.
export const useRegisterInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerInstitution,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-institutions"] }),
  });
};

export const useRegisterParent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerParent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: toastError,
  });
};

export const useRegisterStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerStudent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: toastError,
  });
};
