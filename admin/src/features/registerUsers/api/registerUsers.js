import api from "../../../lib/axios";

export const registerStaff = async ({ formData, token }) => {
  const response = await api.post("/auth/admin/register/staff", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const registerInstitution = async ({ formData, token }) => {
  const { data } = await api.post(
    "/institutions/admin/register/institution",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data;
};

export const registerParent = async ({ formData, token }) => {
  const { data } = await api.post("/parents/register", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const registerStudent = async ({ formData, token }) => {
  const { data } = await api.post(
    "/students/admin/register/student",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data;
};
