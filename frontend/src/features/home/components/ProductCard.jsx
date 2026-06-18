import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { icons } from "../../../assets/icon/icons";
import { useAddCartItem } from "../../cart/hooks/useCart";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";
import { useProductStore } from "../../products/store/productStore";

const ProductCard = ({
  id,
  image,
  name,
  price,
  schoolName,
  schoolId,
  listing_type = "Thrift Store",
}) => {
  const addCartItemMutation = useAddCartItem();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist,
  );
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);

  const isWishlisted = wishlistItems.some((item) => item.id === id);
  const currency = useProductStore((state) => state.currency);
  const productData = {
    id,
    image,
    name,
    price: Number(price),
    schoolName,
    schoolId,
    listing_type,
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist(productData);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addCartItemMutation.mutateAsync(id);
      toast.success("Added to backpack");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add item to cart");
    }
  };

  return (
    <Link
      to={`/products/${id}`}
      className="text-gray-700 cursor-pointer bg-white/90 block w-full max-w-[300px] h-full flex flex-col"
    >
      <div className="overflow-hidden relative flex-shrink-0">
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-primary text-on-primary text-xs font-bold py-1 px-2 rounded-full">
            {listing_type}
          </span>
        </div>
        <img
          src={image[0]}
          alt={name}
          loading="lazy"
          className="h-48 w-full object-cover hover:scale-110 transition ease-in-out"
        />
      </div>

      <div className="p-3 flex flex-col grow">
        <div className="flex-grow">
          <p className="mb-1 text-sm text-gray-500">{schoolName}</p>
          <h3 className="line-clamp-2 font-headline-md text-[20px] text-on-surface leading-tight min-h-[3rem]">
            {name}
          </h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="font-headline-md text-primary text-[20px]">
            {currency}
            {price}
          </p>

          <button
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className="cursor-pointer"
          >
            <img
              src={
                isWishlisted
                  ? icons.heart_active_icon
                  : icons.heart_inactive_icon
              }
              alt=""
              className="w-6 h-6"
            />
          </button>
        </div>

        <button
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-caps text-xs sm:text-sm chunky-button flex items-center justify-center gap-3 cursor-pointer hover:bg-primary/90 active:bg-primary/80 transition-colors mt-auto disabled:opacity-60"
          onClick={handleAddToCart}
          disabled={addCartItemMutation.isPending}
        >
          <img
            src={icons.add_to_cart_icon}
            alt=""
            className="md:hidden lg:inline-block"
          />
          {addCartItemMutation.isPending ? "Adding..." : "Add to Backpack"}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
