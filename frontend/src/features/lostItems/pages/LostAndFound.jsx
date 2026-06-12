import React from "react";
import useAuthStore from "../../auth/store/authStore";
import { useProductStore } from "../../products/store/productStore";
import ProductCard from "../../home/components/ProductCard";

const LostAndFound = () => {
  const user = useAuthStore((state) => state.user);
  const productData = useProductStore((state) => state.products);
  const filteredProducts = Array.isArray(productData)
    ? productData.filter((product) => product.listing_type === "Lost and Found")
    : [];
  return (
    <div className="mt-3">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4 hidden lg:block">
          {user?.institution_name} Lost and Found Products
        </h1>
        <p className="font-body-lg text-label-caps text-outline max-w-2xl hidden lg:block">
          These are products that students have lost and want to get back
        </p>
      </div>

      <div className="mt-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filteredProducts.map((product) => (
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

export default LostAndFound;
