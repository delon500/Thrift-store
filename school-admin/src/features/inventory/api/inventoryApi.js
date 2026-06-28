import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Resolve a sticker (token or code) to the linked owner's name, so the add-item
// form can show whose found item it is. Returns { found, code?, ownerName? }.
export const lookupSticker = async ({ value, token }) => {
  const response = await api.get(
    `/school/sticker/${encodeURIComponent(value)}`,
    authHeaders(token),
  );
  return response.data;
};

export const getSchoolProducts = async ({ token, q, status, limit, offset }) => {
  const response = await api.get("/school/products", {
    ...authHeaders(token),
    params: { q, status, limit, offset },
  });

  return response.data; // { products, total }
};

// Create a product for the staff's own institution (the backend forces it).
export const createSchoolProduct = async ({ formData, images, token }) => {
  const data = new FormData();
  Object.entries(formData).forEach(([key, value]) => data.append(key, value));
  Object.entries(images).forEach(([key, file]) => {
    if (file) data.append(key, file);
  });

  const response = await api.post("/school/products", data, authHeaders(token));
  return response.data;
};

// AI auto-fill from the uploaded images.
export const analyzeSchoolProduct = async ({ images, token }) => {
  const data = new FormData();
  Object.entries(images).forEach(([key, file]) => {
    if (file) data.append(key, file);
  });

  const response = await api.post(
    "/school/products/analyze",
    data,
    authHeaders(token),
  );
  return response.data;
};

// Update / delete a product the staff's institution owns.
export const updateSchoolProduct = async ({ id, updates, token }) => {
  const response = await api.patch(
    `/school/products/${id}`,
    updates,
    authHeaders(token),
  );
  return response.data;
};

export const deleteSchoolProduct = async ({ id, token }) => {
  const response = await api.delete(
    `/school/products/${id}`,
    authHeaders(token),
  );
  return response.data;
};
