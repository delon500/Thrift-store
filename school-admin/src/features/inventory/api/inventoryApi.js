import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getSchoolProducts = async ({ token, q, status, limit, offset }) => {
  const response = await api.get("/school/products", {
    ...authHeaders(token),
    params: { q, status, limit, offset },
  });

  return response.data; // { products, total }
};
