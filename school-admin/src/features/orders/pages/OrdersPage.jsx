import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  PageHeader,
  Badge,
  inputClass,
  tableWrapClass,
  theadClass,
  thClass,
  rowClass,
  tdClass,
} from "../../../components/shared/ui";
import Pagination from "../../../components/shared/Pagination";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { useOrders } from "../hooks/useOrders";
import { ORDER_STATUSES, STATUS_TONE, formatStatus } from "../lib/orderStatus";

const PAGE_SIZE = 10;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const OrdersPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebouncedValue(query);

  // Reset to page 1 whenever the search/filter changes.
  const filterKey = `${debouncedQuery}|${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useOrders({
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Every order for your school — search, filter, and open one to collect."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by reference, name, or email..."
          className={`${inputClass} w-full`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load orders"}
        </p>
      ) : null}

      <section className={`mt-6 ${tableWrapClass}`}>
        {isLoading ? (
          <p className="p-5 text-on-surface-variant">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-5 text-on-surface-variant">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Order</th>
                  <th className={thClass}>Buyer</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Placed</th>
                  <th className={`${thClass} text-right`}>Open</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_reference} className={rowClass}>
                    <td className={`${tdClass} font-semibold`}>
                      {order.order_reference}
                    </td>
                    <td className={tdClass}>
                      <p className="font-medium text-on-surface">
                        {order.user_full_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {order.user_email}
                      </p>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={STATUS_TONE[order.status] || "neutral"}>
                        {formatStatus(order.status)}
                      </Badge>
                    </td>
                    <td className={`${tdClass} font-bold`}>R{order.total}</td>
                    <td className={tdClass}>{formatDate(order.created_at)}</td>
                    <td className={`${tdClass} text-right`}>
                      <Link
                        to={`/school/orders/${order.order_reference}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        View <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
};

export default OrdersPage;
