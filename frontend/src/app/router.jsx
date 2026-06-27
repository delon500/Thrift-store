/* eslint-disable react-refresh/only-export-components -- this is route config,
   not a fast-refresh component module; it exports the router. */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import AuthPage from "../features/auth/pages/AuthPage";
import NotFoundPage from "../pages/NotFoundPage";

// Code-split the routed pages so the initial bundle only carries the shell +
// the login entry; each page loads on demand (Suspense fallback in PublicLayout).
const HomePage = lazy(() => import("../pages/HomePage"));
const Cart = lazy(() => import("../features/cart/pages/Cart"));
const WishlistPage = lazy(() => import("../features/wishlist/pages/WishlistPage"));
const Product = lazy(() => import("../features/home/pages/Product"));
const LostAndFound = lazy(() => import("../features/lostItems/pages/LostAndFound"));
const ThriftStore = lazy(() => import("../features/thriftStore/pages/ThriftStore"));
const Settings = lazy(() => import("../features/settings/pages/Settings"));
const Checkout = lazy(() => import("../features/checkout/pages/Checkout"));
const Orders = lazy(() => import("../features/orders/pages/Orders"));
const OrderDetail = lazy(() => import("../features/orders/pages/OrderDetail"));
const NotificationsPage = lazy(
  () => import("../features/notifications/pages/NotificationsPage"),
);
const HowItWorks = lazy(() => import("../features/info/pages/HowItWorks"));
const MyFamily = lazy(() => import("../features/family/pages/MyFamily"));
const ActivateTag = lazy(() => import("../features/tags/pages/ActivateTag"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
    errorElement: <NotFoundPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <PublicLayout />,
        errorElement: <NotFoundPage />,
        children: [
          { path: "products", element: <HomePage /> },
          { path: "cart", element: <Cart /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "products/:id", element: <Product /> },
          { path: "lost-found", element: <LostAndFound /> },
          { path: "thrift-store", element: <ThriftStore /> },
          { path: "settings", element: <Settings /> },
          { path: "checkout", element: <Checkout /> },
          { path: "orders", element: <Orders /> },
          { path: "orders/:orderReference", element: <OrderDetail /> },
          { path: "family", element: <MyFamily /> },
          { path: "t/:value", element: <ActivateTag /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "how-it-works", element: <HowItWorks /> },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <NotFoundPage />,
  },
]);

export default router;
