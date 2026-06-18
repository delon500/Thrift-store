import { useMemo, useState } from "react";
import MarketProductCard from "../features/home/components/MarketProductCard";
import { ProductCardSkeleton } from "../components/shared/Skeleton";
import { useProductStore } from "../features/products/store/productStore";
import { useGetProducts } from "../features/products/hooks/useProduct";
import useAuthStore from "../features/auth/store/authStore";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const PAGE_SIZE = 8;
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Thrift store", value: "Thrift Store" },
  { label: "Lost & found", value: "Lost and Found" },
];

const selectClass =
  "rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 py-2 text-sm text-[var(--mk-ink)] outline-none focus:border-[var(--mk-primary)]";

const HomePage = () => {
  const productData = useProductStore((state) => state.products);
  const searchQuery = useProductStore((state) => state.searchQuery);
  const user = useAuthStore((state) => state.user);
  const { isLoading, isError, refetch } = useGetProducts();
  useDocumentTitle("Browse Items");

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
    <div className="mt-3 rounded-3xl bg-[var(--mk-canvas)] p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--mk-ink)] sm:text-3xl">
          {user?.institution_name || "School"} thrift store
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mk-muted)] sm:text-base">
          Give pre-loved school items a second life — buy online, then collect at
          school with your reference number.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const active = listingFilter === category.value;
          return (
            <button
              key={category.label}
              type="button"
              onClick={() => setListingFilter(category.value)}
              aria-pressed={active}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--mk-ink)] text-white"
                  : "border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-muted)] hover:border-[var(--mk-ink)]"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-[var(--mk-muted)]">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "item" : "items"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
            aria-label="Filter by condition"
            className={selectClass}
          >
            <option value="">Any condition</option>
            {CONDITIONS.map((conditionOption) => (
              <option key={conditionOption} value={conditionOption}>
                {conditionOption}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
            className={selectClass}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setListingFilter("");
                setConditionFilter("");
              }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--mk-primary)] hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {isLoading && productData.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : isError && productData.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-semibold text-[var(--mk-ink)]">
            We couldn&apos;t load the store right now.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-[var(--mk-primary)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--mk-primary-dark)]"
          >
            Try again
          </button>
        </div>
      ) : pageItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-semibold text-[var(--mk-ink)]">No items found</p>
          <p className="text-sm text-[var(--mk-muted)]">
            Try a different search or clear your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
      )}

      {totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 py-2 text-sm font-semibold text-[var(--mk-ink)] disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={`h-9 w-9 rounded-full text-sm font-bold ${
                  pageNumber === currentPage
                    ? "bg-[var(--mk-primary)] text-white"
                    : "border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-ink)]"
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
            className="rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 py-2 text-sm font-semibold text-[var(--mk-ink)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default HomePage;
