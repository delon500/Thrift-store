import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Plus } from "lucide-react";
import { PageHeader, Badge, inputClass } from "../../../components/shared/ui";
import Pagination from "../../../components/shared/Pagination";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { useInventory } from "../hooks/useInventory";

const PAGE_SIZE = 12;

// product_status enum values (must match the DB exactly).
const PRODUCT_STATUSES = [
  "Available",
  "Reserved",
  "Claimed",
  "Sold",
  "Pending",
  "Cancelled",
];

const STATUS_TONE = {
  Available: "success",
  Reserved: "info",
  Claimed: "primary",
  Sold: "neutral",
  Pending: "warning",
  Cancelled: "danger",
};

const InventoryPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebouncedValue(query);

  const filterKey = `${debouncedQuery}|${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useInventory({
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Your school's listed items and their live status."
      >
        <Link
          to="/school/inventory/add"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-container"
        >
          <Plus size={16} aria-hidden="true" />
          Add item
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, reference, or category..."
          className={`${inputClass} w-full`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load inventory"}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-on-surface-variant">Loading inventory...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-on-surface-variant">No items found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-outline-variant bg-surface"
            >
              <div className="flex aspect-square w-full items-center justify-center bg-surface-container-high">
                {product.image?.[0] ? (
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff
                    size={28}
                    aria-hidden="true"
                    className="text-on-surface-variant"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                    {product.listing_type}
                  </span>
                  <Badge tone={STATUS_TONE[product.status] || "neutral"}>
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 truncate font-bold text-on-surface">
                  {product.name}
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {product.reference_number}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    {product.condition}
                  </span>
                  <span className="text-lg font-black text-primary">
                    R{product.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
};

export default InventoryPage;
