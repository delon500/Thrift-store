import api from "../../../lib/axios";

export const getProducts = async (token) => {
  const response = await api.get("/products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
