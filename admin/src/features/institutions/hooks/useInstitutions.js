import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  deleteInstitution,
  getAdminInstitutions,
  getInstitutionSettings,
  updateInstitution,
  updateInstitutionSettings,
} from "../api/institutionsApi";

export const useInstitutionSettings = (id) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-institution-settings", id],
    queryFn: () => getInstitutionSettings({ id, token }),
    enabled: !!token && !!id,
  });
};

export const useUpdateInstitutionSettings = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }) => updateInstitutionSettings({ id, body, token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-institution-settings", variables.id],
      });
    },
  });
};

export const useInstitutions = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-institutions", params],
    queryFn: () => getAdminInstitutions({ token, params }),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
};

export const useUpdateInstitution = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateInstitution({ id, updates, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
    },
  });
};

export const useDeleteInstitution = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteInstitution({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
    },
  });
};
