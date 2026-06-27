import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import SchoolLayout from "../layout/SchoolLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CollectionsPage from "../features/collections/pages/CollectionsPage";
import LostFoundPage from "../features/lostFound/pages/LostFoundPage";
import OrdersPage from "../features/orders/pages/OrdersPage";
import OrderDetailPage from "../features/orders/pages/OrderDetailPage";
import HistoryPage from "../features/history/pages/HistoryPage";
import InventoryPage from "../features/inventory/pages/InventoryPage";
import AddItemPage from "../features/inventory/pages/AddItemPage";
import AccountPage from "../features/account/pages/AccountPage";
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
          { path: "lost-found", element: <LostFoundPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:orderReference", element: <OrderDetailPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "inventory/add", element: <AddItemPage /> },
          { path: "account", element: <AccountPage /> },
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
