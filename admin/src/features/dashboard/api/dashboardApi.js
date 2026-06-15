import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getStats = async (token) => {
  const response = await api.get("/admin/stats", authHeaders(token));

  return response.data;
};

export const getLogs = async ({ token, limit = 15 }) => {
  const response = await api.get("/admin/logs", {
    ...authHeaders(token),
    params: { limit },
  });

  return response.data;
};
