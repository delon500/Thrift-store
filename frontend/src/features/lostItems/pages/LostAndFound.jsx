import { useState } from "react";
import useAuthStore from "../../auth/store/authStore";
import { useProductStore } from "../../products/store/productStore";
import MarketProductCard from "../../home/components/MarketProductCard";
import Pagination from "../../../components/shared/Pagination";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const PAGE_SIZE = 12;

const LostAndFound = () => {
  useDocumentTitle("Lost & found");
  const user = useAuthStore((state) => state.user);
  const productData = useProductStore((state) => state.products);
  const filtered = Array.isArray(productData)
    ? productData.filter((product) => product.listing_type === "Lost and Found")
    : [];

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  // Clamp in case the list shrank below the current page (e.g. products reload).
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const goPage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
        {user?.institution_name || "School"} lost &amp; found
      </h1>
      <p className="mt-1 text-on-surface-variant">
        Items handed in at school, waiting to be claimed.
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-on-surface-variant">
          No lost &amp; found items available right now.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {pageItems.map((product) => (
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
          <Pagination page={safePage} totalPages={totalPages} onPage={goPage} />
        </>
      )}
    </div>
  );
};

export default LostAndFound;
