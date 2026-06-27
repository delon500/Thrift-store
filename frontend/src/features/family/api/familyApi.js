import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// The signed-in parent's child profiles + any admin-linked student accounts.
export const getMyFamily = async (token) => {
  const response = await api.get("/parents/me/children", authHeaders(token));
  return response.data; // { children, students }
};

export const createChild = async ({ body, token }) => {
  const response = await api.post(
    "/parents/me/children",
    body,
    authHeaders(token),
  );
  return response.data; // { child }
};

export const updateChild = async ({ id, body, token }) => {
  const response = await api.patch(
    `/parents/me/children/${id}`,
    body,
    authHeaders(token),
  );
  return response.data; // { child }
};

export const deleteChild = async ({ id, token }) => {
  const response = await api.delete(
    `/parents/me/children/${id}`,
    authHeaders(token),
  );
  return response.data;
};
