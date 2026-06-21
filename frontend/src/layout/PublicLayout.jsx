import { Suspense, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import { Outlet } from "react-router-dom";
import Footer from "../components/shared/Footer";
import PageLoader from "../components/shared/PageLoader";
import { useProductStore } from "../features/products/store/productStore";
import { useGetProducts } from "../features/products/hooks/useProduct";

const PublicLayout = () => {
  const setProducts = useProductStore((state) => state.setProducts);
  const { data: products = [] } = useGetProducts();
  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />
        <main className="w-full min-w-0 px-4 py-6 sm:px-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PublicLayout;
