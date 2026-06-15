import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getUsersByRole = async ({ role, token }) => {
  const response = await api.get("/admin/users", {
    ...authHeaders(token),
    params: role ? { role } : {},
  });

  return response.data.users;
};
