import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getOrders = async ({
  token,
  q,
  status,
  limit,
  offset,
  collectedFrom,
  collectedTo,
}) => {
  const response = await api.get("/school/orders", {
    ...authHeaders(token),
    params: { q, status, limit, offset, collectedFrom, collectedTo },
  });

  return response.data; // { orders, total }
};

export const getOrder = async ({ token, orderReference }) => {
  const response = await api.get(
    `/school/orders/${orderReference}`,
    authHeaders(token),
  );

  return response.data.order;
};
