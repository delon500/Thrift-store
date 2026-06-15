import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../../auth/store/authStore";
import { getUsersByRole } from "../api/registeredUsersApi";

export const useUsersByRole = (role) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-users", role],
    queryFn: () => getUsersByRole({ role, token }),
    enabled: !!token,
  });
};
