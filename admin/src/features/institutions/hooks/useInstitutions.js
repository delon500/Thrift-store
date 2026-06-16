import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  deleteInstitution,
  getAdminInstitutions,
  updateInstitution,
} from "../api/institutionsApi";

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
