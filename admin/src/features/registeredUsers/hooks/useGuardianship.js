import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import {
  getParentStudents,
  linkStudent,
  unlinkStudent,
} from "../api/guardianshipApi";

export const useParentStudents = (parentId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["parent-students", parentId],
    queryFn: () => getParentStudents({ parentId, token }),
    enabled: !!token && !!parentId,
  });
};

export const useLinkStudent = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, studentId }) =>
      linkStudent({ parentId, studentId, token }),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["parent-students", variables.parentId],
      }),
  });
};

export const useUnlinkStudent = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, studentId }) =>
      unlinkStudent({ parentId, studentId, token }),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["parent-students", variables.parentId],
      }),
  });
};
