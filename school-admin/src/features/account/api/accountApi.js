import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const updateMe = async ({ updates, token }) => {
  const response = await api.patch("/users/me", updates, authHeaders(token));
  return response.data.user;
};

export const changePassword = async ({ payload, token }) => {
  const response = await api.patch(
    "/users/me/password",
    payload,
    authHeaders(token),
  );
  return response.data;
};
