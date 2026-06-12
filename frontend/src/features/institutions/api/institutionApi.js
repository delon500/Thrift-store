import api from "../../../lib/axios";

const getInstitutions = async () => {
  const response = await api.get("/institutions");
  return response.data;
};

export { getInstitutions };
