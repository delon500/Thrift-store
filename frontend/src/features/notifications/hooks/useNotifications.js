import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";

// Full list (used by the bell dropdown and the notifications page).
export const useNotifications = (params = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications({ token, params }),
    enabled: !!token,
  });
};

// Lightweight unread count for the bell badge. Polls so the badge stays fresh
// while the user is on the app (e.g. an order becomes ready via the ITN).
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
