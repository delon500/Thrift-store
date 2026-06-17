import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useProductStore } from "../../products/store/productStore";
import { useMyOrders, useResumeOrder } from "../hooks/useOrders";

const PAGE_SIZE = 5;

// Build and submit a hidden form to PayFast, exactly like the checkout page does.
const submitToPayfast = (gateway) => {
  if (!gateway?.process_url) return;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = gateway.process_url;

  Object.entries(gateway.form_fields || {}).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const STATUS = {
  payment_pending: { label: "Awaiting payment", cls: "bg-amber-100 text-amber-800" },
  payment_failed: { label: "Payment failed", cls: "bg-red-100 text-red-700" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  ready_for_collection: {
    label: "Ready for collection",
    cls: "bg-emerald-100 text-emerald-700",
  },
  collected: { label: "Collected", cls: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Cancelled", cls: "bg-slate-200 text-slate-600" },
  expired: { label: "Expired", cls: "bg-slate-200 text-slate-600" },
  confirmed: { label: "Confirmed", cls: "bg-sky-100 text-sky-700" },
};

const statusLabel = (status) => STATUS[status]?.label || status;

const formatMoney = (amount) => Number(amount || 0).toFixed(2);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

const StatusBadge = ({ status }) => {
  const meta = STATUS[status] || { label: status, cls: "bg-slate-200 text-slate-600" };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const currency = useProductStore((state) => state.currency);
  const { data: orders = [], isLoading, isError, error } = useMyOrders();
  const resumeMutation = useResumeOrder();

  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Reset to the first page whenever the filters change (render-time pattern,
  // no effect / cascading renders).
  const filterKey = `${statusFilter}|${query.trim().toLowerCase()}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const handleResume = async (orderReference) => {
    try {
      const checkout = await resumeMutation.mutateAsync(orderReference);
      submitToPayfast(checkout.payment_gateway);
    } catch (resumeError) {
      toast.error(
        resumeError?.response?.data?.message || "Could not resume payment",
      );
    }
  };

  if (isLoading) {
    return <div className="m-6 text-on-surface-variant">Loading your orders...</div>;
  }

  if (isError) {
    return (
      <div className="m-6 text-error">
        Could not load your orders
        {error?.response?.data?.message ? `: ${error.response.data.message}` : "."}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="m-6">
        <h1 className="text-3xl font-bold text-on-surface">My orders</h1>
        <p className="mt-3 text-on-surface-variant">
          You have not placed any orders yet.
        </p>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mt-6 rounded-full bg-primary px-5 py-3 font-bold text-on-primary"
        >
          Browse products
        </button>
      </div>
    );
  }

  const presentStatuses = [...new Set(orders.map((order) => order.status))];
  const q = query.trim().toLowerCase();
  const filtered = orders.filter((order) => {
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesQuery =
      !q || order.order_reference.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="m-6">
      <h1 className="text-4xl font-bold text-on-surface">My orders</h1>
      <p className="mt-2 text-on-surface-variant">
        Track payment and collection status for your reservations.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order reference..."
          className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary"
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
        <div className="mt-6 grid gap-6">
          {pageOrders.map((order) => {
            const readyToCollect = order.status === "ready_for_collection";

            return (
              <section
                key={order.order_reference}
                className="rounded-lg border border-outline-variant bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-on-surface-variant">
                      {formatDate(order.created_at)}
                    </p>
                    <h2 className="text-xl font-bold text-on-surface">
                      {order.order_reference}
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Collect from {order.institution_name}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {readyToCollect ? (
                  <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                    Paid — show order reference {order.order_reference} at{" "}
                    {order.institution_name} to collect your items.
                  </p>
                ) : null}

                {order.status === "payment_pending" ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">
                      This order is awaiting payment.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleResume(order.order_reference)}
                      disabled={resumeMutation.isPending}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
                    >
                      {resumeMutation.isPending
                        ? "Loading..."
                        : "Continue to payment"}
                    </button>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {order.items.map((item) => (
                    <div
                      key={item.reference_number}
                      className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3 text-sm"
                    >
                      <img
                        src={item.image || ""}
                        alt={item.product_name}
                        className="h-14 w-14 flex-shrink-0 rounded-lg bg-white object-cover"
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="font-bold text-on-surface">
                          {item.product_name}
                        </p>
                        <p className="text-on-surface-variant">
                          {item.listing_type} · Ref {item.reference_number}
                        </p>
                      </div>
                      <p className="flex-shrink-0 font-bold text-on-surface">
                        {currency}
                        {formatMoney(item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-2 border-t border-outline-variant pt-4 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>
                      {currency}
                      {formatMoney(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Service fee</span>
                    <span>
                      {currency}
                      {formatMoney(order.service_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-primary">
                    <span>Total</span>
                    <span>
                      {currency}
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}
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
  );
};

export default Orders;
