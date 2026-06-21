import useAuthStore from "../../auth/store/authStore";
import { useProductStore } from "../../products/store/productStore";
import MarketProductCard from "../../home/components/MarketProductCard";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const ThriftStore = () => {
  useDocumentTitle("Thrift store");
  const user = useAuthStore((state) => state.user);
  const productData = useProductStore((state) => state.products);
  const filtered = Array.isArray(productData)
    ? productData.filter((product) => product.listing_type === "Thrift Store")
    : [];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
        {user?.institution_name || "School"} thrift store
      </h1>
      <p className="mt-1 text-on-surface-variant">
        Pre-loved uniforms, books, and gear at fair prices.
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-on-surface-variant">
          No thrift items available right now.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
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

export default ThriftStore;
