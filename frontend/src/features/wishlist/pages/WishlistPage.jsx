import React from "react";
import { useWishlistStore } from "../store/wishlistStore";
import ProductCard from "../../home/components/ProductCard";

const WishlistPage = () => {
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const removeFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist,
  );

  return (
    <div className="mt-3">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            My Saved Finds
          </h1>
          <p className="text-body-lg font-body-lg text-outline">
            Items you've saved from your school store.
          </p>
        </div>
      </div>

      <div className="mt-10">
        {wishlistItems.length === 0 ? (
          <p className="text-on-surface-variant">Your wishlist is empty.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.image}
                name={product.name}
                price={product.price}
                schoolName={product.schoolName}
                schoolId={product.schoolId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
