import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getUsersByRole = async ({ role, token, params = {} }) => {
  const response = await api.get("/admin/users", {
    ...authHeaders(token),
    params: { ...(role ? { role } : {}), ...params },
  });

  return response.data; // { users, total }
};

export const updateUser = async ({ id, updates, token }) => {
  const response = await api.patch(
    `/admin/users/${id}`,
    updates,
    authHeaders(token),
  );

  return response.data.user;
};

export const resetUserPassword = async ({ id, newPassword, token }) => {
  const response = await api.post(
    `/admin/users/${id}/reset-password`,
    { new_password: newPassword },
    authHeaders(token),
  );

  return response.data;
};

export const deleteUser = async ({ id, token }) => {
  const response = await api.delete(`/admin/users/${id}`, authHeaders(token));

  return response.data;
};
