import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getPaymentMethods = async (token) => {
  const response = await api.get("/checkout/payment-methods", authHeaders(token));

  return response.data.payment_methods;
};

export const createCheckout = async ({ formData, token }) => {
  const response = await api.post(
    "/checkout/create",
    {
      payment_method: formData.payment_method,
      collection_note: formData.collection_note,
    },
    authHeaders(token),
  );

  return response.data.checkout;
};

export const cancelCheckout = async ({ orderReference, token }) => {
  const response = await api.post(
    `/checkout/${orderReference}/cancel`,
    {},
    authHeaders(token),
  );

  return response.data;
};
