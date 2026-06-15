import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getPendingRegistrations = async (token) => {
  const response = await api.get("/admin/registrations", authHeaders(token));

  return response.data.registrations;
};

export const approveRegistration = async ({ id, token }) => {
  const response = await api.patch(
    `/admin/registrations/${id}/approve`,
    {},
    authHeaders(token),
  );

  return response.data;
};

export const rejectRegistration = async ({ id, token }) => {
  const response = await api.patch(
    `/admin/registrations/${id}/reject`,
    {},
    authHeaders(token),
  );

  return response.data;
};
