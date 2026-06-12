import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getOrders = async (token) => {
  const response = await api.get("/admin/orders", authHeaders(token));

  return response.data;
};

export const getOrder = async ({ orderReference, token }) => {
  const response = await api.get(
    `/admin/orders/${orderReference}`,
    authHeaders(token),
  );

  return response.data.order;
};

export const markOrderCollected = async ({ orderReference, token }) => {
  const response = await api.patch(
    `/admin/orders/${orderReference}/collect`,
    {},
    authHeaders(token),
  );

  return response.data;
};
