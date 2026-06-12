import api from "../../../lib/axios";

const login = async (formData) => {
  const response = await api.post("/auth/admin/login", {
    email: formData.email,
    password: formData.password,
  });

  return response.data;
};

export { login };
