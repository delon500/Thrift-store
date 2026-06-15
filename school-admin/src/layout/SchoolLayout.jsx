import { Outlet } from "react-router-dom";
import useAuthStore from "../features/auth/store/authStore";

const SchoolLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen notebook-grid">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-black text-teal-600">School Collections</h1>
          <p className="text-xs text-gray-500">
            {user?.institution_name || user?.full_name || "School staff"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default SchoolLayout;
