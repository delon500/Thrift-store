import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getAdminProducts = async ({ token, params = {} }) => {
  const response = await api.get("/products/admin", {
    ...authHeaders(token),
    params,
  });

  return response.data; // { products, total }
};

export const updateProduct = async ({ id, updates, token }) => {
  const response = await api.patch(`/products/${id}`, updates, authHeaders(token));

  return response.data.product;
};

export const deleteProduct = async ({ id, token }) => {
  const response = await api.delete(`/products/${id}`, authHeaders(token));

  return response.data;
};
