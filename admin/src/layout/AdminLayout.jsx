import React from "react";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../features/auth/store/authStore";
import AuthPage from "../features/auth/pages/AuthPage";

const AdminLayout = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen notebook-grid">
      <>
        <Navbar />
        <hr />

        <main className="flex w-full">
          <Sidebar />
          <div className="w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base">
            <Outlet />
          </div>
        </main>
      </>
    </div>
  );
};

export default AdminLayout;
