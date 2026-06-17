import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router-dom";
import { useProductStore } from "../../products/store/productStore";
import { useGetProducts } from "../../products/hooks/useProduct";
import { icons } from "../../../assets/icon/icons";
import { useAddCartItem } from "../../cart/hooks/useCart";
import { Skeleton } from "../../../components/shared/Skeleton";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const ProductDetailSkeleton = () => (
  <div className="mt-10 flex flex-col lg:flex-row gap-6">
    <div className="flex-1">
      <Skeleton className="h-[500px] w-full max-w-[600px] rounded-none" />
      <div className="mt-4 flex gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[100px] w-[100px] rounded-none" />
        ))}
      </div>
    </div>
    <div className="flex w-full flex-col gap-4 border border-outline-variant p-4 lg:w-1/3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-8 w-1/3" />
      <div className="flex flex-col gap-4 border-t-2 border-teal-100 pt-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  </div>
);

const CenteredState = ({ title, children }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <h1 className="font-headline-md text-2xl text-on-surface">{title}</h1>
    {children}
  </div>
);

const Product = () => {
  const { id } = useParams();
  const { data: products = [], isLoading, isError, refetch } = useGetProducts();
  const currency = useProductStore((state) => state.currency);
  const addCartItemMutation = useAddCartItem();
  const [selectedImages, setSelectedImages] = useState({});

  const product = products.find((item) => item.id === id);
  useDocumentTitle(product?.name || "Item");

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await addCartItemMutation.mutateAsync(product.id);
      toast.success("Item added to cart");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add item to cart");
    }
  };

  // Still loading the catalogue (e.g. a deep link / hard refresh).
  if (isLoading && !product) {
    return <ProductDetailSkeleton />;
  }

  // The catalogue failed to load and we have nothing to show.
  if (isError && !product) {
    return (
      <CenteredState title="We couldn't load this item">
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-primary px-6 py-3 font-headline-md text-on-primary"
        >
          Try again
        </button>
      </CenteredState>
    );
  }

  // Loaded, but no such product — it may have been sold, claimed, or removed.
  if (!product) {
    return (
      <CenteredState title="Item not found">
        <p className="max-w-md text-on-surface-variant">
          This item may have been sold, claimed, or removed.
        </p>
        <Link
          to="/products"
          className="rounded-xl bg-primary px-6 py-3 font-headline-md text-on-primary"
        >
          Back to the store
        </Link>
      </CenteredState>
    );
  }

  const images = Array.isArray(product.image) ? product.image : [];
  const image = selectedImages[id] || images[0] || "";
  const relatedProducts = products.filter(
    (item) =>
      item.schoolName?.trim().toLowerCase() ===
        product.schoolName?.trim().toLowerCase() && item.id !== id,
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Images */}
        <div className="flex-1 ">
          <div className="relative w-full max-w-[600px] h-[500px] overflow-hidden  bg-slate-50 border border-slate-100">
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-primary text-on-primary text-xs font-bold py-1 px-2 rounded-full">
                {product.listing_type}
              </span>
            </div>
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto">
            {images.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setSelectedImages((current) => ({
                    ...current,
                    [id]: item,
                  }))
                }
                className={`overflow-hidden border-2 transition-all duration-200 w-full max-w-[100px] max-h-[100px] ${
                  image === item
                    ? "border-teal-500 ring-2 ring-teal-100 shadow-md"
                    : "border-slate-200 hover:border-teal-300"
                }`}
              >
                <img
                  src={item}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white border border-outline-variant p-md shadow-sm w-full lg:w-1/3 p-4 notebook-pattern self-start">
          <div className="flex flex-col gap-2">
            <span className="text-primary font-bold text-sm tracking-widest uppercase">
              {product.schoolName}
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {product.name}
            </h2>
            <div className="flex items-center gap-4 ">
              <span className="text-headline-lg font-headline-lg text-primary">
                {currency}
                {product.price}
              </span>
            </div>
          </div>

          <div className="my-4 space-y-4 border-t-2  border-teal-100 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.size_icon} alt="" />
                Size
              </span>
              <span className="font-bold">{product.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.category_icon} alt="" />
                Category
              </span>
              <span className="font-bold">{product.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.condtion_icon} alt="" />
                Condition
              </span>
              <span className="font-bold">{product.condition}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.condtion_icon} alt="" />
                Gender
              </span>
              <span className="font-bold">{product.gender}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.condtion_icon} alt="" />
                Status
              </span>
              <span className="font-bold">{product.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline flex items-center gap-2">
                <img src={icons.product_description_icon} alt="" />
                Reference
              </span>
              <span className="font-bold">{product.reference_number}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="w-full bg-primary text-on-primary py-5 rounded-lg font-headline-md text-lg chunky-button flex items-center justify-center gap-3 cursor-pointer hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleAddToCart}
              disabled={
                addCartItemMutation.isPending || product.status !== "Available"
              }
            >
              <img src={icons.add_to_cart_icon} alt="" />
              {product.status !== "Available"
                ? "Unavailable"
                : addCartItemMutation.isPending
                  ? "Adding..."
                  : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      <section className="mt-12 mb-20 bg-white border border-outline-variant p-8 shadow-sm  rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-xl text-primary flex items-center gap-2">
            <img src={icons.product_description_icon} alt="" />
            Product Description
          </h3>
        </div>
        <p className="text-on-surface-variant space-y-4 max-w-full leading-relaxed text-sm">
          {product.description}
        </p>
      </section>
      <section className="mt-12 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-xl">
            Other items from {product?.schoolName}
          </h3>
          <Link
            className="text-primary font-bold hover:underline flex items-center gap-1"
            to="/products"
          >
            View All
            <img src={icons.forward_arrow_icon} alt="" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-x-6 place-items-center sm:place-items-start">
          {relatedProducts.length > 0 ? (
            relatedProducts.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                className="bg-white border border-outline-variant  shadow-sm hover:shadow-md transition-shadow  w-[300px]"
              >
                <div className="w-full aspect-square overflow-hidden bg-slate-50">
                  <img
                    src={item.image?.[0]}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 px-4 pb-4">
                  <span className="text-primary font-bold text-sm uppercase">
                    {item.schoolName}
                  </span>
                  <h4 className="font-bold text-on-surface">{item.name}</h4>
                  <p className="text-primary font-bold">
                    {currency}
                    {item.price}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-outline">No other items from this school yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Product;
