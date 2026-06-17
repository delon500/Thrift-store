import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getSettings = async (token) => {
  const response = await api.get("/admin/settings", authHeaders(token));

  return response.data; // { settings, payment_method_catalog }
};

export const updateSettings = async ({ patch, token }) => {
  const response = await api.put("/admin/settings", patch, authHeaders(token));

  return response.data; // { message, settings }
};
