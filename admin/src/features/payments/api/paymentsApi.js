import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getPayments = async ({ token, params = {} }) => {
  const response = await api.get("/admin/payments", {
    ...authHeaders(token),
    params,
  });

  return response.data; // { payments, total, summary }
};

export const getPayment = async ({ id, token }) => {
  const response = await api.get(`/admin/payments/${id}`, authHeaders(token));

  return response.data.payment;
};

export const recoverPayment = async ({ orderReference, token }) => {
  const response = await api.post(
    `/admin/payments/${orderReference}/recover`,
    {},
    authHeaders(token),
  );

  return response.data;
};
