import { useMutation } from "@tanstack/react-query";
import {
  registerInstitution,
  registerParent,
  registerStaff,
  registerStudent,
} from "../api/registerUsers";

export const useRegisterStaff = () => {
  return useMutation({
    mutationFn: registerStaff,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};

export const useRegisterInstitution = () => {
  return useMutation({
    mutationFn: registerInstitution,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};

export const useRegisterParent = () => {
  return useMutation({
    mutationFn: registerParent,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};

export const useRegisterStudent = () => {
  return useMutation({
    mutationFn: registerStudent,
    onError: (error) => {
      console.log(error.response?.data || error.message);
    },
  });
};
