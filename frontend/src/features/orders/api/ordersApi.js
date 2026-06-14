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
