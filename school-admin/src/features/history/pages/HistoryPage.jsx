import { useState } from "react";
import { toast } from "react-toastify";
import { Download } from "lucide-react";
import {
  PageHeader,
  inputClass,
  tableWrapClass,
  theadClass,
  thClass,
  rowClass,
  tdClass,
} from "../../../components/shared/ui";
import Pagination from "../../../components/shared/Pagination";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { downloadCsv, toCsv } from "../../../lib/csv";
import useAuthStore from "../../auth/store/authStore";
import { useOrders } from "../../orders/hooks/useOrders";
import { getOrders } from "../../orders/api/ordersApi";

const PAGE_SIZE = 10;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const CSV_COLUMNS = [
  { label: "Order reference", get: (row) => row.order_reference },
  { label: "Buyer", get: (row) => row.user_full_name },
  { label: "Email", get: (row) => row.user_email },
  { label: "Total (R)", get: (row) => row.total },
  { label: "Placed", get: (row) => formatDate(row.created_at) },
  { label: "Collected", get: (row) => formatDate(row.collected_at) },
];

const HistoryPage = () => {
  const token = useAuthStore((state) => state.token);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const debouncedQuery = useDebouncedValue(query);

  // Reset to page 1 whenever a filter changes.
  const filterKey = `${debouncedQuery}|${from}|${to}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filters = {
    status: "collected",
    q: debouncedQuery || undefined,
    collectedFrom: from || undefined,
    collectedTo: to || undefined,
  };

  const { data, isLoading, isError, error } = useOrders({
    ...filters,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export every matching row, not just the current page.
      const all = await getOrders({ token, ...filters });
      const rows = all.orders || [];
      if (rows.length === 0) {
        toast.info("Nothing to export for these filters.");
        return;
      }
      downloadCsv("collection-history.csv", toCsv(rows, CSV_COLUMNS));
    } catch {
      toast.error("Could not export the history.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Collection history"
        subtitle="Items handed over — filter by date and download a CSV."
      >
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
        >
          <Download size={16} aria-hidden="true" />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by reference, name, or email..."
          className={`${inputClass} w-full`}
        />
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load history"}
        </p>
      ) : null}

      <section className={`mt-6 ${tableWrapClass}`}>
        {isLoading ? (
          <p className="p-5 text-on-surface-variant">Loading history...</p>
        ) : orders.length === 0 ? (
          <p className="p-5 text-on-surface-variant">
            No collected orders for these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Order</th>
                  <th className={thClass}>Buyer</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Collected</th>
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
                    <td className={`${tdClass} font-bold`}>R{order.total}</td>
                    <td className={tdClass}>{formatDate(order.collected_at)}</td>
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

export default HistoryPage;
