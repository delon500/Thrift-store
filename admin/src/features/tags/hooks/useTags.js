import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  createTagBatch,
  getTagBatch,
  listTagBatches,
} from "../api/tagsApi";

export const useTagBatches = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["tag-batches"],
    queryFn: () => listTagBatches({ token }),
    enabled: !!token,
  });
};

export const useTagBatch = (id) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["tag-batch", id],
    queryFn: () => getTagBatch({ id, token }),
    enabled: !!token && !!id,
  });
};

export const useCreateTagBatch = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => createTagBatch({ body, token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tag-batches"] }),
  });
};
