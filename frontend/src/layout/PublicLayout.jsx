import React, { useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import { Outlet } from "react-router-dom";
import Footer from "../components/shared/Footer";
import { useProductStore } from "../features/products/store/productStore";
import { useGetProducts } from "../features/products/hooks/useProduct";

const PublicLayout = () => {
  const setProducts = useProductStore((state) => state.setProducts);
  const { data: products = [], isLoading } = useGetProducts();
  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  return (
    <div className="min-h-screen notebook-grid">
      <div className="flex w-full">
        <Sidebar />
        <main className="px-0 sm:px-[1vw] md:px-[2vw] lg:px-[3vw] w-full">
          <Navbar />
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PublicLayout;
