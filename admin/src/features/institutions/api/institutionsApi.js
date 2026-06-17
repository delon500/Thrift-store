import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Public list (used for register/add-item dropdowns).
const getInstitutions = async () => {
  const response = await api.get("/institutions");
  return response.data;
};

// Admin management list (paginated, with user/product counts).
const getAdminInstitutions = async ({ token, params = {} }) => {
  const response = await api.get("/admin/institutions", {
    ...authHeaders(token),
    params,
  });

  return response.data; // { institutions, total }
};

const updateInstitution = async ({ id, updates, token }) => {
  const response = await api.patch(
    `/admin/institutions/${id}`,
    updates,
    authHeaders(token),
  );

  return response.data.institution;
};

const deleteInstitution = async ({ id, token }) => {
  const response = await api.delete(
    `/admin/institutions/${id}`,
    authHeaders(token),
  );

  return response.data;
};

export {
  deleteInstitution,
  getAdminInstitutions,
  getInstitutions,
  updateInstitution,
};
