import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getMyProfile = async (token) => {
  const response = await api.get("/users/me", authHeaders(token));

  return response.data.user;
};

export const updateMyProfile = async ({ formData, token }) => {
  const response = await api.patch(
    "/users/me",
    {
      full_name: formData.full_name,
      contact_number: formData.contact_number,
    },
    authHeaders(token),
  );

  return response.data.user;
};

export const changeMyPassword = async ({ formData, token }) => {
  const response = await api.patch(
    "/users/me/password",
    {
      current_password: formData.current_password,
      new_password: formData.new_password,
      confirm_password: formData.confirm_password,
    },
    authHeaders(token),
  );

  return response.data;
};
