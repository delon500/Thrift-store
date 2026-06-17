import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getSettings, updateSettings } from "../api/settingsApi";

export const useSettings = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettings(token),
    enabled: !!token,
  });
};

export const useUpdateSettings = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch) => updateSettings({ patch, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });
};
