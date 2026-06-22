import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import useAuthStore from "../../auth/store/authStore";
import { getOrders } from "../../orders/api/orderApi";
import { getUsersByRole } from "../../registeredUsers/api/registeredUsersApi";
import { getAdminProducts } from "../../inventory/api/inventoryApi";
import { getPayments } from "../../payments/api/paymentsApi";
import { downloadCsv, toCsv } from "../lib/csv";
import { Badge, PageHeader, SummaryCard } from "../../../components/shared/ui";
import Pagination from "../../../components/shared/Pagination";

const PAGE_SIZE = 10;

const ORDER_STATUSES = [
  "payment_pending",
  "ready_for_collection",
  "paid",
  "collected",
  "cancelled",
  "expired",
  "payment_failed",
];

const STATUS_TONE = {
  ready_for_collection: "info",
  paid: "success",
  collected: "success",
  payment_pending: "warning",
  payment_failed: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

const formatStatus = (status) =>
  status
    ? status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "—";

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const ORDER_COLUMNS = [
  { label: "Order Reference", get: (o) => o.order_reference },
  { label: "Customer", get: (o) => o.user_full_name },
  { label: "Email", get: (o) => o.user_email },
  { label: "School", get: (o) => o.institution_name },
  { label: "Status", get: (o) => o.status },
  { label: "Payment", get: (o) => o.payment_status },
  { label: "Method", get: (o) => o.payment_method },
  { label: "Total (R)", get: (o) => o.total },
  { label: "Placed", get: (o) => formatDate(o.created_at) },
];

// Quick CSV exports (Users / Inventory / Payments) — upgraded to workspaces later.
const QUICK_REPORTS = {
  users: {
    name: "Users report",
    description:
      "All registered users with role, status, institution, and contact details.",
    fetcher: (token) =>
      getUsersByRole({ role: undefined, token }).then((data) => data.users),
    columns: [
      { label: "Name", get: (u) => u.full_name },
      { label: "Email", get: (u) => u.email },
      { label: "Contact", get: (u) => u.contact_number },
      { label: "Role", get: (u) => u.role },
      { label: "Status", get: (u) => u.status },
      { label: "Institution", get: (u) => u.institution_name },
      { label: "Joined", get: (u) => u.created_at },
    ],
  },
  inventory: {
    name: "Inventory report",
    description: "All products across schools with status, price, and condition.",
    fetcher: (token) => getAdminProducts({ token }).then((data) => data.products),
    columns: [
      { label: "Name", get: (p) => p.name },
      { label: "Reference", get: (p) => p.reference_number },
      { label: "School", get: (p) => p.schoolName },
      { label: "Listing", get: (p) => p.listing_type },
      { label: "Status", get: (p) => p.status },
      { label: "Price (R)", get: (p) => p.price },
      { label: "Condition", get: (p) => p.condition },
      { label: "Category", get: (p) => p.category },
    ],
  },
  payments: {
    name: "Payments report",
    description:
      "Every payment with order, customer, school, status, amount, and PayFast reference.",
    fetcher: (token) => getPayments({ token }).then((data) => data.payments),
    columns: [
      { label: "Order Reference", get: (p) => p.order_reference },
      { label: "Customer", get: (p) => p.user_full_name },
      { label: "Email", get: (p) => p.user_email },
      { label: "School", get: (p) => p.institution_name },
      { label: "Status", get: (p) => p.status },
      { label: "Method", get: (p) => p.payment_method },
      { label: "Amount (R)", get: (p) => p.amount },
      { label: "PayFast Ref", get: (p) => p.provider_payment_id },
      { label: "Paid At", get: (p) => p.paid_at },
    ],
  },
};

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "inventory", label: "Inventory" },
  { key: "payments", label: "Payments" },
];

const inputClass =
  "rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";

const OrdersReport = ({ token }) => {
  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ["report-orders"],
    queryFn: () => getOrders({ token }).then((data) => data.orders || []),
    enabled: !!token,
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [school, setSchool] = useState("");
  const [page, setPage] = useState(1);

  const schools = useMemo(
    () =>
      [...new Set(orders.map((o) => o.institution_name).filter(Boolean))].sort(),
    [orders],
  );

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const day = o.created_at ? String(o.created_at).slice(0, 10) : "";
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (status && o.status !== status) return false;
        if (school && o.institution_name !== school) return false;
        return true;
      }),
    [orders, from, to, status, school],
  );

  const filterKey = `${from}|${to}|${status}|${school}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setPage(1);
  }

  const kpis = useMemo(() => {
    const grossSales = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const paid = filtered.filter((o) =>
      ["paid", "ready_for_collection", "collected"].includes(o.status),
    ).length;
    const collected = filtered.filter((o) => o.status === "collected").length;
    const pending = filtered.filter((o) => o.status === "payment_pending").length;
    return { count: filtered.length, grossSales, paid, collected, pending };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("Nothing to export for these filters.");
      return;
    }
    const meta = [
      ["Report", "Orders"],
      ["Generated", new Date().toLocaleString()],
      ["Date range", `${from || "start"} to ${to || "now"}`],
      ["Status", status || "All"],
      ["School", school || "All"],
      ["Rows", String(filtered.length)],
    ];
    const metaCsv = meta.map((row) => row.join(",")).join("\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `orders-report-${date}.csv`,
      `${metaCsv}\n\n${toCsv(filtered, ORDER_COLUMNS)}`,
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
          School
          <select value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass}>
            <option value="">All schools</option>
            {schools.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleExport}
          className="ml-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          Export CSV
        </button>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load orders"}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Orders" value={isLoading ? "—" : kpis.count} accent="text-primary" />
        <SummaryCard label="Gross sales" value={isLoading ? "—" : zar.format(kpis.grossSales)} />
        <SummaryCard label="Paid" value={isLoading ? "—" : kpis.paid} />
        <SummaryCard label="Collected" value={isLoading ? "—" : kpis.collected} />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-white">
        {isLoading ? (
          <p className="p-5 text-on-surface-variant">Loading orders...</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-on-surface-variant">No orders match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-2 text-xs text-on-surface-variant">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
            </div>
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr key={o.order_reference} className="border-t border-outline-variant">
                    <td className="px-4 py-3 font-semibold text-on-surface">{o.order_reference}</td>
                    <td className="px-4 py-3">
                      <p className="text-on-surface">{o.user_full_name}</p>
                      <p className="text-xs text-on-surface-variant">{o.user_email}</p>
                    </td>
                    <td className="px-4 py-3">{o.institution_name}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[o.status] || "neutral"}>{formatStatus(o.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatStatus(o.payment_status)}</td>
                    <td className="px-4 py-3 font-bold">R{o.total}</td>
                    <td className="px-4 py-3">{formatDate(o.created_at)}</td>
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

const QuickExport = ({ token, report }) => {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const data = await report.fetcher(token);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`report-${date}.csv`, toCsv(data || [], report.columns));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not generate the report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md rounded-2xl border border-outline-variant bg-white p-6">
      <h2 className="text-lg font-black text-on-surface">{report.name}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{report.description}</p>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? "Preparing..." : "Download CSV"}
      </button>
    </div>
  );
};

const ReportsPage = () => {
  const token = useAuthStore((state) => state.token);
  const [tab, setTab] = useState("orders");

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Filter, preview, and export. Open in Excel or Google Sheets."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-primary text-white"
                : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "orders" ? (
          <OrdersReport token={token} />
        ) : (
          <QuickExport token={token} report={QUICK_REPORTS[tab]} />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
