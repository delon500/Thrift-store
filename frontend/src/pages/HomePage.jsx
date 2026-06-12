import React, { useEffect, useMemo } from "react";
import { icons } from "../assets/icon/icons";
import ProductCard from "../features/home/components/ProductCard";
import { useProductStore } from "../features/products/store/productStore";
import useAuthStore from "../features/auth/store/authStore";

const HomePage = () => {
  const productData = useProductStore((state) => state.products);
  const searchQuery = useProductStore((state) => state.searchQuery);
  const user = useAuthStore((state) => state.user);
  const filteredProducts = productData.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div className="mt-3">
      <div className="flex ">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4 hidden lg:block">
            {user?.institution_name}
          </h1>
          <p className="font-body-lg text-label-caps text-outline max-w-2xl hidden lg:block">
            High-quality blazers, skirts, and cardigans looking for their next
            owner. Perfectly clean and ready for the next term!
          </p>
        </div>

        <div className="flex items-center md:justify-between lg:justify-items-start lg:gap-4 m-auto sm:ml-auto border border-[var(--color-outline)] md:border-none md:w-full">
          <span className="m-0">
            <h1 className="font-headline-lg text-label-caps font-black ml-3 text-on-surface hidden md:block lg:hidden">
              School Uniforms
            </h1>
          </span>
          <div className="flex items-center lg:gap-4">
            <button className="bg-white border-4 border-teal-50 px-5 py-2 rounded-none lg:rounded-xl font-label-caps text-primary lg:shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer">
              <img src={icons.filter_icon} />
              Filters
            </button>
            <button className="bg-primary text-white px-5 py-2 rounded-none lg:rounded-xl font-label-caps lg:shadow-[0_4px_0_0_#00433f] active:shadow-none active:translate-y-1 transition-all cursor-pointer">
              Sort: Newest
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {Array.isArray(filteredProducts) &&
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.image}
                name={product.name}
                price={product.price}
                schoolName={product.schoolName}
                schoolId={product.schoolId}
                listing_type={product.listing_type}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
