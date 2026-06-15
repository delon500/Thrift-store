import api from "../../../lib/axios";

const login = async (formData) => {
  const response = await api.post("/auth/admin/login", {
    email: formData.email,
    password: formData.password,
  });

  return response.data;
};

const getMe = async (token) => {
  const response = await api.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.user;
};

export { getMe, login };
