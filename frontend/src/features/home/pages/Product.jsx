import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Ruler,
  Tag,
  Sparkles,
  User,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { useGetProducts } from "../../products/hooks/useProduct";
import { useAddCartItem } from "../../cart/hooks/useCart";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";
import { Skeleton } from "../../../components/shared/Skeleton";
import MarketProductCard from "../components/MarketProductCard";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const formatPrice = (value) =>
  "R " +
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23f1efe8'/></svg>`,
  );

const ProductDetailSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-2">
    <div>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="mt-4 flex gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-20 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-4">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  </div>
);

const CenteredState = ({ title, children }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
    {children}
  </div>
);

const Spec = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <span className="flex items-center gap-2 text-sm text-on-surface-variant">
      <Icon size={16} aria-hidden="true" />
      {label}
    </span>
    <span className="text-sm font-semibold text-on-surface">{value || "—"}</span>
  </div>
);

const Product = () => {
  const { id } = useParams();
  const { data: products = [], isLoading, isError, refetch } = useGetProducts();
  const addCartItemMutation = useAddCartItem();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const [selectedImages, setSelectedImages] = useState({});

  const product = products.find((item) => item.id === id);
  useDocumentTitle(product?.name || "Item");

  const isWishlisted = wishlistItems.some((item) => item.id === id);

  const handleAddToCart = async () => {
    try {
      await addCartItemMutation.mutateAsync(product.id);
      toast.success("Item added to cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add item to cart");
    }
  };

  const handleWishlist = () => {
    if (isWishlisted) removeFromWishlist(id);
    else
      addToWishlist({
        id,
        image: product.image,
        name: product.name,
        price: Number(product.price),
        schoolName: product.schoolName,
        schoolId: product.schoolId,
        listing_type: product.listing_type,
      });
  };

  if (isLoading && !product) return <ProductDetailSkeleton />;

  if (isError && !product) {
    return (
      <CenteredState title="We couldn't load this item">
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
        >
          Try again
        </button>
      </CenteredState>
    );
  }

  if (!product) {
    return (
      <CenteredState title="Item not found">
        <p className="max-w-md text-on-surface-variant">
          This item may have been sold, claimed, or removed.
        </p>
        <Link
          to="/products"
          className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
        >
          Back to the store
        </Link>
      </CenteredState>
    );
  }

  const images = Array.isArray(product.image) ? product.image : [];
  const cover = selectedImages[id] || images[0] || FALLBACK;
  const available = product.status === "Available";
  const relatedProducts = products.filter(
    (item) =>
      item.schoolName?.trim().toLowerCase() ===
        product.schoolName?.trim().toLowerCase() && item.id !== id,
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        to="/products"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to store
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-outline-variant bg-[#f1efe8]">
            <span className="absolute left-3 top-3 z-10 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-on-surface backdrop-blur">
              {product.listing_type}
            </span>
            <img
              src={cover}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src = FALLBACK;
              }}
              className="h-full w-full object-cover"
            />
          </div>

          {images.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {images.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setSelectedImages((current) => ({ ...current, [id]: item }))
                  }
                  aria-label={`View image ${index + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    cover === item
                      ? "border-primary"
                      : "border-outline-variant hover:border-primary/50"
                  }`}
                >
                  <img
                    src={item}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK;
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {product.schoolName}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold text-on-surface">
              {formatPrice(product.price)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                available
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {available ? "Available" : product.status}
            </span>
          </div>

          <div className="mt-5 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-surface px-4">
            <Spec icon={Ruler} label="Size" value={product.age} />
            <Spec icon={Tag} label="Category" value={product.category} />
            <Spec icon={Sparkles} label="Condition" value={product.condition} />
            <Spec icon={User} label="Gender" value={product.gender} />
            <Spec icon={Hash} label="Reference" value={product.reference_number} />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addCartItemMutation.isPending || !available}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {!available
                ? "Unavailable"
                : addCartItemMutation.isPending
                  ? "Adding..."
                  : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWishlisted}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              <Heart
                size={20}
                fill={isWishlisted ? "currentColor" : "none"}
                className={isWishlisted ? "text-primary" : ""}
                aria-hidden="true"
              />
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            Pay online, then collect at {product.schoolName} with your reference
            number.
          </p>
        </div>
      </div>

      {product.description ? (
        <section className="mt-12 rounded-2xl border border-outline-variant bg-surface p-6">
          <h2 className="text-lg font-bold text-on-surface">Description</h2>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            {product.description}
          </p>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="mt-12 mb-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">
              More from {product.schoolName}
            </h2>
            <Link
              to="/products"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((item) => (
              <MarketProductCard
                key={item.id}
                id={item.id}
                image={item.image}
                name={item.name}
                price={item.price}
                schoolName={item.schoolName}
                schoolId={item.schoolId}
                listing_type={item.listing_type}
                condition={item.condition}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Product;
