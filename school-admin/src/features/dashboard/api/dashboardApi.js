import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getDashboard = async (token) => {
  const response = await api.get("/school/dashboard", authHeaders(token));
  return response.data;
};
