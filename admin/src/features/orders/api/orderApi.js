import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getOrders = async ({ token, params = {} }) => {
  const response = await api.get("/admin/orders", {
    ...authHeaders(token),
    params,
  });

  return response.data; // { orders, total }
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

export const cancelOrder = async ({ orderReference, token }) => {
  const response = await api.post(
    `/admin/orders/${orderReference}/cancel`,
    {},
    authHeaders(token),
  );

  return response.data;
};

export const refundOrder = async ({ orderReference, token }) => {
  const response = await api.post(
    `/admin/orders/${orderReference}/refund`,
    {},
    authHeaders(token),
  );

  return response.data;
};
