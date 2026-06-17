import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";

export const useNotifications = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications({ token, params }),
    enabled: !!token,
  });
};

// Lightweight unread count for the bell badge. Polls so admins see operational
// alerts (new registrations, failed payments) without a refresh.
export const useUnreadCount = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => getUnreadCount(token),
    enabled: !!token,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useMarkRead = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => markNotificationRead({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useMarkAllRead = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};
