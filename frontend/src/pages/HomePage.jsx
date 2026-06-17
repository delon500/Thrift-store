import { useMemo, useState } from "react";
import { icons } from "../assets/icon/icons";
import ProductCard from "../features/home/components/ProductCard";
import { ProductCardSkeleton } from "../components/shared/Skeleton";
import { useProductStore } from "../features/products/store/productStore";
import { useGetProducts } from "../features/products/hooks/useProduct";
import useAuthStore from "../features/auth/store/authStore";

const PAGE_SIZE = 8;
const LISTING_TYPES = ["Thrift Store", "Lost and Found"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

const HomePage = () => {
  const productData = useProductStore((state) => state.products);
  const searchQuery = useProductStore((state) => state.searchQuery);
  const user = useAuthStore((state) => state.user);
  const { isLoading, isError, refetch } = useGetProducts();

  const [showFilters, setShowFilters] = useState(false);
  const [listingFilter, setListingFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const result = productData.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(query);
      const matchesListing =
        !listingFilter || product.listing_type === listingFilter;
      const matchesCondition =
        !conditionFilter || product.condition === conditionFilter;

      return matchesSearch && matchesListing && matchesCondition;
    });

    if (sort === "price-asc") {
      return [...result].sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sort === "price-desc") {
      return [...result].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [productData, searchQuery, listingFilter, conditionFilter, sort]);

  // Jump back to the first page whenever the search/filters/sort change, using
  // the "reset state during render" pattern (no effect, no cascading renders).
  const filterKey = `${searchQuery}|${listingFilter}|${conditionFilter}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilters = listingFilter || conditionFilter;

  return (
    <div className="mt-3">
      <div className="flex">
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
          <div className="flex items-center lg:gap-4">
            <button
              onClick={() => setShowFilters((value) => !value)}
              className={`bg-white border-4 px-5 py-2 rounded-none lg:rounded-xl font-label-caps lg:shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                showFilters || hasActiveFilters
                  ? "border-primary text-primary"
                  : "border-teal-50 text-primary"
              }`}
            >
              <img src={icons.filter_icon} />
              Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-primary text-white px-5 py-2 rounded-none lg:rounded-xl font-label-caps lg:shadow-[0_4px_0_0_#00433f] transition-all cursor-pointer outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {showFilters ? (
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-outline-variant bg-white p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-on-surface-variant">
              Listing type
            </span>
            <select
              value={listingFilter}
              onChange={(e) => setListingFilter(e.target.value)}
              className="rounded-lg border border-outline-variant px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">All</option>
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-on-surface-variant">
              Condition
            </span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="rounded-lg border border-outline-variant px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">Any</option>
              {CONDITIONS.map((conditionOption) => (
                <option key={conditionOption} value={conditionOption}>
                  {conditionOption}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setListingFilter("");
                setConditionFilter("");
              }}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10">
        {isLoading && productData.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : isError && productData.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="font-semibold text-on-surface">
              We couldn&apos;t load the store right now.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-on-primary"
            >
              Try again
            </button>
          </div>
        ) : pageItems.length === 0 ? (
          <p className="text-outline">No products match your search or filters.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {pageItems.map((product) => (
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
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-lg text-sm font-bold ${
                    pageNumber === currentPage
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HomePage;
