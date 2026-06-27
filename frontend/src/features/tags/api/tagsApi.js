import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Resolve a sticker by its token (from the QR URL) or code (typed manually).
export const lookupTag = async ({ value, token }) => {
  const response = await api.get(
    `/tags/lookup/${encodeURIComponent(value)}`,
    authHeaders(token),
  );
  return response.data; // { tag, sameInstitution, ownedByMe, claimable }
};

// body: { value, owner: 'self' | childId, label }
export const activateTag = async ({ body, token }) => {
  const response = await api.post("/tags/activate", body, authHeaders(token));
  return response.data; // { tag }
};

export const getMyTags = async (token) => {
  const response = await api.get("/tags/mine", authHeaders(token));
  return response.data.tags;
};

export const deactivateTag = async ({ tagToken, token }) => {
  const response = await api.post(
    `/tags/${tagToken}/deactivate`,
    {},
    authHeaders(token),
  );
  return response.data;
};
