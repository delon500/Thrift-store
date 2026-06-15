import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getReadyOrders = async (token) => {
  const response = await api.get("/school/orders", {
    ...authHeaders(token),
    params: { status: "ready_for_collection" },
  });

  return response.data.orders;
};

export const lookupReference = async ({ reference, token }) => {
  const response = await api.get("/school/lookup", {
    ...authHeaders(token),
    params: { reference },
  });

  return response.data.order;
};

export const markCollected = async ({ orderReference, token }) => {
  const response = await api.patch(
    `/school/orders/${orderReference}/collect`,
    {},
    authHeaders(token),
  );

  return response.data;
};
