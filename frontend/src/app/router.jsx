import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "../pages/NotFoundPage";
import HomePage from "../pages/HomePage";
import PublicLayout from "../layout/PublicLayout";
import Cart from "../features/cart/pages/Cart";
import SellItemHomePage from "../features/sell/pages/SellItemHomePage";
import AddProductPage from "../features/sell/pages/AddProductPage";
import MyProductsPage from "../features/sell/pages/MyProductsPage";
import AuthPage from "../features/auth/pages/AuthPage";
import WishlistPage from "../features/wishlist/pages/WishlistPage";
import CreateShop from "../features/sell/pages/CreateShop";
import Product from "../features/home/pages/Product";
import LostAndFound from "../features/lostItems/pages/LostAndFound";
import ThriftStore from "../features/thriftStore/pages/ThriftStore";
import Settings from "../features/settings/pages/Settings";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import Checkout from "../features/checkout/pages/Checkout";

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
          { path: "sell", element: <SellItemHomePage /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "products/:id", element: <Product /> },
          { path: "lost-found", element: <LostAndFound /> },
          { path: "thrift-store", element: <ThriftStore /> },
          { path: "settings", element: <Settings /> },
          { path: "checkout", element: <Checkout /> },
          // { path: "sell/my-products", element: <MyProductsPage /> },
          // { path: "sell/add-product", element: <AddProductPage /> },
          // { path: "sell/create", element: <CreateShop /> },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <NotFoundPage />,
  },
  // {
  //   path: "/wishlist",
  //   element: <WishlistPage />,
  //   errorElement: <NotFoundPage />,
  // },
]);

export default router;
