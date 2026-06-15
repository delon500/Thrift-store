import api from "../../../lib/axios";

const registerParentStudent = async (formData) => {
  const response = await api.post("/auth/register/student-parent", {
    full_name: formData.fullName,
    email: formData.email,
    contact_number: formData.contactNumber,
    institution_id: formData.selectedInstitution?.id,
    password: formData.password,
    confirm_password: formData.confirmPassword,
    role: formData.role,
  });

  return response.data;
};

const registerInstitution = async (formData) => {
  const response = await api.post("/auth/register/institution", {
    contact_person_name: formData.contactPerson,
    contact_email: formData.email,
    contact_number: formData.contactNumber,
    institution_name: formData.institutionName,
    registration_number: formData.registrationNumber,
    institution_phone: formData.institutionPhone,
    institution_type: formData.institutionType,
    password: formData.password,
    confirm_password: formData.confirmPassword,
    role: formData.role,
  });

  return response.data;
};

const login = async (formData) => {
  const response = await api.post("/auth/login", {
    email: formData.email,
    password: formData.password,
  });

  return response.data;
};

export { registerParentStudent, registerInstitution, login };
