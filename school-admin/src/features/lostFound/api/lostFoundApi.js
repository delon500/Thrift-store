import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Scan/enter an active tag (token or code) to report a found item. Response is
// label + LF reference only (no owner details).
export const reportFound = async ({ value, token }) => {
  const response = await api.post(
    "/school/found-reports",
    { value },
    authHeaders(token),
  );
  return response.data; // { reference, label, status, emailed, message }
};

export const getFoundReports = async (token) => {
  const response = await api.get("/school/found-reports", authHeaders(token));
  return response.data.reports;
};

export const markReturned = async ({ id, token }) => {
  const response = await api.patch(
    `/school/found-reports/${id}/return`,
    {},
    authHeaders(token),
  );
  return response.data;
};
