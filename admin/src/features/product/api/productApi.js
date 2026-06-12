import api from "../../../lib/axios";

export const analyzeProduct = async ({ images, token }) => {
  const data = new FormData();

  Object.entries(images).forEach(([key, file]) => {
    if (file) data.append(key, file);
  });

  const response = await api.post("/products/analyze", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
export const createProduct = async ({ formData, images, token }) => {
  const data = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    data.append(key, value);
  });

  Object.entries(images).forEach(([key, file]) => {
    if (file) data.append(key, file);
  });
  const response = await api.post("/products", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};


