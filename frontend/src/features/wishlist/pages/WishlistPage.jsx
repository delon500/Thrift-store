import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlistStore } from "../store/wishlistStore";
import MarketProductCard from "../../home/components/MarketProductCard";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const WishlistPage = () => {
  useDocumentTitle("Wishlist");
  const navigate = useNavigate();
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
        Saved items
      </h1>
      <p className="mt-1 text-on-surface-variant">
        Items you've saved from your school store.
      </p>

      {wishlistItems.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
            <Heart size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">No saved items yet</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Tap the heart on any item to save it for later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
          >
            Browse items
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map((product) => (
            <MarketProductCard
              key={product.id}
              id={product.id}
              image={product.image}
              name={product.name}
              price={product.price}
              schoolName={product.schoolName}
              schoolId={product.schoolId}
              listing_type={product.listing_type}
              condition={product.condition}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
