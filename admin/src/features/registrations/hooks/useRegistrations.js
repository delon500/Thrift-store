import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  approveRegistration,
  getPendingRegistrations,
  rejectRegistration,
} from "../api/registrationsApi";

export const useRegistrations = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => getPendingRegistrations(token),
    enabled: !!token,
  });
};

export const useApproveRegistration = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => approveRegistration({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
    },
  });
};

export const useRejectRegistration = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => rejectRegistration({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
    },
  });
};
