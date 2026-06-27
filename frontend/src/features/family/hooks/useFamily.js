import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  getMyFamily,
  createChild,
  updateChild,
  deleteChild,
} from "../api/familyApi";

export const useMyFamily = () => {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: ["my-family"],
    queryFn: () => getMyFamily(token),
    enabled: !!token && role === "parent",
  });
};

export const useCreateChild = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => createChild({ body, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-family"] }),
  });
};

export const useUpdateChild = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }) => updateChild({ id, body, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-family"] }),
  });
};

export const useDeleteChild = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteChild({ id, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-family"] }),
  });
};
