import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../features/auth/store/authStore";

const AdminLayout = () => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen w-full min-w-0 flex-col">
          <Navbar />
          <main className="flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
