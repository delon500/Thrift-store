import { useMutation } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: registerStaff,
    onError: toastError,
  });
};

// The School/University pages handle success + error at the call site, so this
// hook stays neutral to avoid a duplicate error toast.
export const useRegisterInstitution = () => {
  return useMutation({
    mutationFn: registerInstitution,
  });
};

export const useRegisterParent = () => {
  return useMutation({
    mutationFn: registerParent,
    onError: toastError,
  });
};

export const useRegisterStudent = () => {
  return useMutation({
    mutationFn: registerStudent,
    onError: toastError,
  });
};
