import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getNotifications = async ({ token, params = {} }) => {
  const response = await api.get("/notifications", {
    ...authHeaders(token),
    params,
  });

  return response.data; // { notifications, total, unread }
};

export const getUnreadCount = async (token) => {
  const response = await api.get("/notifications/unread-count", authHeaders(token));

  return response.data.unread;
};

export const markNotificationRead = async ({ id, token }) => {
  const response = await api.patch(
    `/notifications/${id}/read`,
    {},
    authHeaders(token),
  );

  return response.data;
};

export const markAllNotificationsRead = async (token) => {
  const response = await api.patch("/notifications/read-all", {}, authHeaders(token));

  return response.data;
};
