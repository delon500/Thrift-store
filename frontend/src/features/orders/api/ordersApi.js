import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getMyOrders = async (token) => {
  const response = await api.get("/orders", authHeaders(token));

  return response.data.orders;
};

export const resumeOrderPayment = async ({ orderReference, token }) => {
  const response = await api.post(
    `/checkout/${orderReference}/resume`,
    {},
    authHeaders(token),
  );

  return response.data.checkout;
};
