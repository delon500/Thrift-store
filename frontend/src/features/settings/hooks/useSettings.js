import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from "../api/settingsApi";

export const useMyProfile = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["me"],
    queryFn: () => getMyProfile(token),
    enabled: !!token,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (formData) => updateMyProfile({ formData, token }),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["me"], user);
    },
  });
};

export const useChangeMyPassword = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (formData) => changeMyPassword({ formData, token }),
  });
};
