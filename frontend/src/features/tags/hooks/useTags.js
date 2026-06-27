import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  lookupTag,
  activateTag,
  getMyTags,
  deactivateTag,
} from "../api/tagsApi";

export const useTagLookup = (value) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["tag-lookup", value],
    queryFn: () => lookupTag({ value, token }),
    enabled: !!token && !!value,
    retry: false,
  });
};

export const useMyTags = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["my-tags"],
    queryFn: () => getMyTags(token),
    enabled: !!token,
  });
};

export const useActivateTag = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => activateTag({ body, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag-lookup"] });
    },
  });
};

export const useDeactivateTag = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagToken) => deactivateTag({ tagToken, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-tags"] }),
  });
};
