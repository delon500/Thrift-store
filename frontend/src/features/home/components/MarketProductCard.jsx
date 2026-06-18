import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAddCartItem } from "../../cart/hooks/useCart";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";

const formatPrice = (value) =>
  `R ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// 1x1 transparent fallback so a broken image URL degrades gracefully.
const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='%23f1efe8'/></svg>`,
  );

const MarketProductCard = ({
  id,
  image,
  name,
  price,
  schoolName,
  schoolId,
  listing_type = "Thrift Store",
  condition,
}) => {
  const addCartItemMutation = useAddCartItem();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const isWishlisted = wishlistItems.some((item) => item.id === id);

  const cover = (Array.isArray(image) ? image[0] : image) || FALLBACK;

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isWishlisted) removeFromWishlist(id);
    else
      addToWishlist({
        id,
        image,
        name,
        price: Number(price),
        schoolName,
        schoolId,
        listing_type,
      });
  };

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await addCartItemMutation.mutateAsync(id);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add item to cart");
    }
  };

  return (
    <Link
      to={`/products/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] transition-shadow hover:shadow-[0_8px_24px_rgba(23,21,15,0.08)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f1efe8]">
        <img
          src={cover}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-[var(--mk-surface)]/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--mk-ink)] backdrop-blur">
          {listing_type === "Lost and Found" ? "Lost & found" : condition || "Thrift"}
        </span>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mk-surface)]/90 backdrop-blur transition-colors hover:bg-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={isWishlisted ? "var(--mk-accent)" : "none"}
            stroke={isWishlisted ? "var(--mk-accent)" : "var(--mk-muted)"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      <div className="flex grow flex-col p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--mk-muted)]">
          {schoolName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--mk-ink)]">
          {name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[17px] font-bold text-[var(--mk-ink)]">
            {formatPrice(price)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addCartItemMutation.isPending}
            aria-label={`Add ${name} to cart`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mk-primary)] text-white transition-colors hover:bg-[var(--mk-primary-dark)] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default MarketProductCard;
