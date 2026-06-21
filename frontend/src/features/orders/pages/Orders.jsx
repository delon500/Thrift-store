import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Package, ChevronRight, MapPin } from "lucide-react";
import { useMyOrders, useResumeOrder } from "../hooks/useOrders";
import { submitToPayfast } from "../lib/submitToPayfast";
import { formatPrice } from "../../../lib/money";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const PAGE_SIZE = 6;

const STATUS = {
  payment_pending: { label: "Awaiting payment", cls: "bg-tertiary-container text-on-tertiary-container" },
  payment_failed: { label: "Payment failed", cls: "bg-error-container text-on-error-container" },
  paid: { label: "Paid", cls: "bg-primary-container text-on-primary-container" },
  ready_for_collection: { label: "Ready to collect", cls: "bg-primary-container text-on-primary-container" },
  collected: { label: "Collected", cls: "bg-surface-container-high text-on-surface-variant" },
  cancelled: { label: "Cancelled", cls: "bg-surface-container-high text-on-surface-variant" },
  expired: { label: "Expired", cls: "bg-surface-container-high text-on-surface-variant" },
};

const statusLabel = (status) => STATUS[status]?.label || status;

// The order reference is the collection credential — only revealed once paid.
const PAID_STATUSES = ["ready_for_collection", "paid", "collected"];
const isPaid = (status) => PAID_STATUSES.includes(status);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const StatusBadge = ({ status }) => {
  const meta = STATUS[status] || { label: status, cls: "bg-surface-container-high text-on-surface-variant" };
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const Orders = () => {
  useDocumentTitle("My Orders");
  const navigate = useNavigate();
  const { data: orders = [], isLoading, isError, error } = useMyOrders();
  const resumeMutation = useResumeOrder();

  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filterKey = `${statusFilter}|${query.trim().toLowerCase()}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const handleResume = async (event, orderReference) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const checkout = await resumeMutation.mutateAsync(orderReference);
      submitToPayfast(checkout.payment_gateway);
    } catch (resumeError) {
      toast.error(resumeError?.response?.data?.message || "Could not resume payment");
    }
  };

  if (isLoading) {
    return <p className="mx-auto max-w-[1000px] text-on-surface-variant">Loading your orders...</p>;
  }

  if (isError) {
    return (
      <p className="mx-auto max-w-[1000px] text-error">
        Could not load your orders
        {error?.response?.data?.message ? `: ${error.response.data.message}` : "."}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">My orders</h1>
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
            <Package size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">No orders yet</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Your purchases and collection passes will appear here.
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
      </div>
    );
  }

  const presentStatuses = [...new Set(orders.map((order) => order.status))];
  const q = query.trim().toLowerCase();
  const filtered = orders.filter((order) => {
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesQuery = !q || order.order_reference.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const inputClass =
    "rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">My orders</h1>
      <p className="mt-1 text-on-surface-variant">
        Track payment and collection for your reservations.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by reference..."
          aria-label="Search by order reference"
          className={`w-full ${inputClass}`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {presentStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {pageOrders.length === 0 ? (
        <p className="mt-8 text-on-surface-variant">
          No orders match your search or filter.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {pageOrders.map((order) => (
            <Link
              key={order.order_reference}
              to={`/orders/${order.order_reference}`}
              className="block rounded-2xl border border-outline-variant bg-surface p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(23,21,15,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-on-surface-variant">
                    {formatDate(order.created_at)}
                  </p>
                  <h2 className="text-lg font-bold text-on-surface">
                    {isPaid(order.status)
                      ? order.order_reference
                      : order.items[0]?.product_name || "Order"}
                  </h2>
                  <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <MapPin size={14} aria-hidden="true" />
                    {order.institution_name}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <img
                    key={item.reference_number}
                    src={item.image || ""}
                    alt={item.product_name}
                    className="h-12 w-12 rounded-lg border border-outline-variant bg-surface-container-low object-cover"
                  />
                ))}
                {order.items.length > 4 ? (
                  <span className="text-sm text-on-surface-variant">
                    +{order.items.length - 4}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
                <span className="font-bold text-on-surface">
                  {formatPrice(order.total)}
                </span>
                {order.status === "payment_pending" ? (
                  <button
                    type="button"
                    onClick={(event) => handleResume(event, order.order_reference)}
                    disabled={resumeMutation.isPending}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-on-primary-container disabled:opacity-60"
                  >
                    {resumeMutation.isPending ? "Loading..." : "Continue to payment"}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    View details
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-40"
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
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant bg-surface text-on-surface"
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
            className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Orders;
