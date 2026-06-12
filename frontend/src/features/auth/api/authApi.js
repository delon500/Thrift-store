import api from "../../../lib/axios";

const registerParentStudent = async (formData) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
};
const registerInstitution = async () => {
  try {
    const response = await api.post("/auth/register/institution", {
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      institution_id: formData.selectedInstitution?.id,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      role: formData.role,
    });

    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const login = async (formData) => {
  const response = await api.post("/auth/login", {
    email: formData.email,
    password: formData.password,
  });

  return response.data;
};

export { registerParentStudent, registerInstitution, login };
