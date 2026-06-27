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

// Per-institution settings (effective + overrides + global + catalog).
const getInstitutionSettings = async ({ id, token }) => {
  const response = await api.get(
    `/admin/institutions/${id}/settings`,
    authHeaders(token),
  );

  return response.data;
};

// body: { service_fee?, checkout_expiry_minutes?, enabled_payment_methods?, clear?: [] }
const updateInstitutionSettings = async ({ id, body, token }) => {
  const response = await api.put(
    `/admin/institutions/${id}/settings`,
    body,
    authHeaders(token),
  );

  return response.data;
};

// The institution's login accounts (school/university-role users).
const getInstitutionStaff = async ({ id, token }) => {
  const response = await api.get(
    `/admin/institutions/${id}/staff`,
    authHeaders(token),
  );

  return response.data; // { institution, users }
};

// body: { full_name, email, contact_number, password, confirm_password }
const createInstitutionStaff = async ({ id, body, token }) => {
  const response = await api.post(
    `/admin/institutions/${id}/staff`,
    body,
    authHeaders(token),
  );

  return response.data;
};

// Issues a fresh temporary password for an account and emails the login details.
const sendInstitutionStaffCredentials = async ({ id, userId, token }) => {
  const response = await api.post(
    `/admin/institutions/${id}/staff/${userId}/send-credentials`,
    {},
    authHeaders(token),
  );

  return response.data; // { message, emailed }
};

export {
  deleteInstitution,
  getAdminInstitutions,
  getInstitutions,
  getInstitutionSettings,
  getInstitutionStaff,
  createInstitutionStaff,
  sendInstitutionStaffCredentials,
  updateInstitution,
  updateInstitutionSettings,
};
