import api from "../../../lib/axios";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// { parent, linked, available } — students linked to this parent + students in
// the same institution that could still be linked.
const getParentStudents = async ({ parentId, token }) => {
  const response = await api.get(
    `/admin/parents/${parentId}/students`,
    authHeaders(token),
  );
  return response.data;
};

const linkStudent = async ({ parentId, studentId, token }) => {
  const response = await api.post(
    `/admin/parents/${parentId}/students`,
    { student_user_id: studentId },
    authHeaders(token),
  );
  return response.data;
};

const unlinkStudent = async ({ parentId, studentId, token }) => {
  const response = await api.delete(
    `/admin/parents/${parentId}/students/${studentId}`,
    authHeaders(token),
  );
  return response.data;
};

export { getParentStudents, linkStudent, unlinkStudent };
