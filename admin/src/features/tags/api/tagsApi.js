import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Every tag batch with its institution + activated count.
const listTagBatches = async ({ token }) => {
  const response = await api.get("/admin/tags/batches", authHeaders(token));
  return response.data; // { batches }
};

// One batch + its tags (codes, tokens, status) — for the printable QR sheet.
const getTagBatch = async ({ id, token }) => {
  const response = await api.get(
    `/admin/tags/batches/${id}`,
    authHeaders(token),
  );
  return response.data; // { batch, tags }
};

// body: { institution_id, quantity, note }
const createTagBatch = async ({ body, token }) => {
  const response = await api.post(
    "/admin/tags/batches",
    body,
    authHeaders(token),
  );
  return response.data; // { batch, tags }
};

export { listTagBatches, getTagBatch, createTagBatch };
