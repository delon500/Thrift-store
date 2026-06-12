import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getCart = async (token) => {
  const response = await api.get("/cart", authHeaders(token));

  return response.data;
};

export const addCartItem = async ({ productId, token }) => {
  const response = await api.post(
    "/cart/items",
    { product_id: productId },
    authHeaders(token),
  );

  return response.data;
};

export const removeCartItem = async ({ cartItemId, token }) => {
  const response = await api.delete(
    `/cart/items/${cartItemId}`,
    authHeaders(token),
  );

  return response.data;
};

export const clearCart = async (token) => {
  const response = await api.delete("/cart", authHeaders(token));

  return response.data;
};

export const checkoutCart = async ({ collectionNote, token }) => {
  const response = await api.post(
    "/cart/checkout",
    { collection_note: collectionNote },
    authHeaders(token),
  );

  return response.data;
};
