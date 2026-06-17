import { createBrowserRouter } from "react-router-dom";
import AdminHome from "../pages/AdminHome";
import AdminNotFoundPage from "../pages/AdminNotFoundPage";
import AdminLayout from "../layout/AdminLayout";
import ItemManagementHomePage from "../features/ItemManagement/pages/ItemManagementHomePage";
import AddItems from "../features/ItemManagement/pages/AddItems";
import AuthPage from "../features/auth/pages/AuthPage";
import RegisterUsersHomePage from "../features/registerUsers/pages/RegisterUsersHomePage";
import RegisterStaff from "../features/registerUsers/pages/RegisterStaff";
import RegisterSchool from "../features/registerUsers/pages/RegisterSchool";
import RegisterParent from "../features/registerUsers/pages/RegisterParent";
import RegisterUniversity from "../features/registerUsers/pages/RegisterUniveristy";
import RegisterStudent from "../features/registerUsers/pages/RegisterStudent";
import OrdersAndCollections from "../features/orders/pages/OrdersAndCollections";
import InventoryPage from "../features/inventory/pages/InventoryPage";
import ViewStore from "../features/inventory/pages/ViewStore";
import RegistrationRequests from "../features/registrations/pages/RegistrationRequests";
import RegisteredUsersHomePage from "../features/registeredUsers/pages/RegisteredUsersHomePage";
import RegisteredUsersList from "../features/registeredUsers/pages/RegisteredUsersList";
import ReportsPage from "../features/reports/pages/ReportsPage";
import AccountPage from "../features/account/pages/AccountPage";
import InstitutionsPage from "../features/institutions/pages/InstitutionsPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminHome /> },
      {
        path: "/admin/lost-and-found-management",
        element: <ItemManagementHomePage />,
      },
      {
        path: "/admin/lost-and-found-management/add-items",
        element: <AddItems />,
      },
      {
        path: "/admin/register-users",
        element: <RegisterUsersHomePage />,
      },
      {
        path: "/admin/register-users/staff",
        element: <RegisterStaff />,
      },
      {
        path: "/admin/register-users/school",
        element: <RegisterSchool />,
      },
      {
        path: "/admin/register-users/parent",
        element: <RegisterParent />,
      },
      {
        path: "/admin/register-users/university",
        element: <RegisterUniversity />,
      },
      {
        path: "/admin/register-users/student",
        element: <RegisterStudent />,
      },
      {
        path: "/admin/orders",
        element: <OrdersAndCollections />,
      },
      {
        path: "/admin/inventory",
        element: <InventoryPage />,
      },
      {
        path: "/admin/view-store",
        element: <ViewStore />,
      },
      {
        path: "/admin/registrations",
        element: <RegistrationRequests />,
      },
      {
        path: "/admin/registered-users",
        element: <RegisteredUsersHomePage />,
      },
      {
        path: "/admin/registered-users/:role",
        element: <RegisteredUsersList />,
      },
      {
        path: "/admin/reports",
        element: <ReportsPage />,
      },
      {
        path: "/admin/account",
        element: <AccountPage />,
      },
      {
        path: "/admin/institutions",
        element: <InstitutionsPage />,
      },
      {
        path: "/admin/payments",
        element: <PaymentsPage />,
      },
      {
        path: "*",
        element: <AdminNotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <AdminNotFoundPage />,
  },
]);

export default router;
