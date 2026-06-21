import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import SchoolLayout from "../layout/SchoolLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CollectionsPage from "../features/collections/pages/CollectionsPage";
import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/school",
        element: <SchoolLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "collections", element: <CollectionsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
