import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
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
    ? String(status)
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

const inputClass =
  "rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";

// Metadata header lines prepended to every export.
const metaCsv = (reportName, filterPairs, rowCount) =>
  [
    ["Report", reportName],
    ["Generated", new Date().toLocaleString()],
    ...filterPairs,
    ["Rows", String(rowCount)],
  ]
    .map((row) => row.join(","))
    .join("\n");

// ---------------------------------------------------------------------------
// Orders report — bespoke (revenue KPIs + chart).
// ---------------------------------------------------------------------------

const ORDER_COLUMNS = [
  { label: "Order Reference", get: (o) => o.order_reference },
  { label: "Customer", get: (o) => o.user_full_name },
  { label: "Email", get: (o) => o.user_email },
  { label: "School", get: (o) => o.institution_name },
  { label: "Status", get: (o) => o.status },
  { label: "Payment", get: (o) => o.payment_status },
  { label: "Method", get: (o) => o.payment_method },
  { label: "Subtotal (R)", get: (o) => o.subtotal },
  { label: "Service fee (R)", get: (o) => o.service_fee },
  { label: "Total (R)", get: (o) => o.total },
  { label: "Placed", get: (o) => formatDate(o.created_at) },
];

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
    () => [...new Set(orders.map((o) => o.institution_name).filter(Boolean))].sort(),
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
    let grossSales = 0;
    let itemSales = 0;
    let fees = 0;
    for (const o of filtered) {
      grossSales += Number(o.total || 0);
      itemSales += Number(o.subtotal || 0);
      fees += Number(o.service_fee || 0);
    }
    return { count: filtered.length, grossSales, itemSales, fees };
  }, [filtered]);

  const [groupBy, setGroupBy] = useState("day");
  const chartData = useMemo(() => {
    const map = new Map();
    for (const o of filtered) {
      const key =
        groupBy === "day"
          ? String(o.created_at).slice(0, 10)
          : o.institution_name || "—";
      map.set(key, (map.get(key) || 0) + Number(o.total || 0));
    }
    const arr = [...map.entries()].map(([label, revenue]) => ({ label, revenue }));
    if (groupBy === "day") arr.sort((a, b) => (a.label < b.label ? -1 : 1));
    else arr.sort((a, b) => b.revenue - a.revenue);
    return arr;
  }, [filtered, groupBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("Nothing to export for these filters.");
      return;
    }
    const filterPairs = [
      ["Date range", `${from || "start"} to ${to || "now"}`],
      ["Status", status || "All"],
      ["School", school || "All"],
    ];
    downloadCsv(
      `orders-report-${new Date().toISOString().slice(0, 10)}.csv`,
      `${metaCsv("Orders", filterPairs, filtered.length)}\n\n${toCsv(filtered, ORDER_COLUMNS)}`,
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
          className="ml-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
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
        <SummaryCard label="Item sales" value={isLoading ? "—" : zar.format(kpis.itemSales)} />
        <SummaryCard label="Service fees" value={isLoading ? "—" : zar.format(kpis.fees)} />
      </div>

      {!isLoading && filtered.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-outline-variant bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-on-surface">Revenue</h2>
            <div className="flex gap-1 rounded-full border border-outline-variant p-1">
              {[
                { key: "day", label: "Over time" },
                { key: "school", label: "By school" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setGroupBy(option.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    groupBy === option.key
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e3da" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b655c" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#6b655c" }} width={48} />
                <Tooltip formatter={(value) => zar.format(value)} cursor={{ fill: "rgba(15,122,82,0.06)" }} />
                <Bar dataKey="revenue" fill="#0f7a52" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <ReportTable
        isLoading={isLoading}
        rows={pageRows}
        total={filtered.length}
        page={page}
        columns={[
          { label: "Order", render: (o) => <span className="font-semibold text-on-surface">{o.order_reference}</span> },
          {
            label: "Customer",
            render: (o) => (
              <div>
                <p className="text-on-surface">{o.user_full_name}</p>
                <p className="text-xs text-on-surface-variant">{o.user_email}</p>
              </div>
            ),
          },
          { label: "School", render: (o) => o.institution_name },
          { label: "Status", render: (o) => <Badge tone={STATUS_TONE[o.status] || "neutral"}>{formatStatus(o.status)}</Badge> },
          { label: "Total", render: (o) => <span className="font-bold">R{o.total}</span> },
          { label: "Placed", render: (o) => formatDate(o.created_at) },
        ]}
        emptyLabel="No orders match these filters."
        rowKey={(o) => o.order_reference}
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared preview table.
// ---------------------------------------------------------------------------

const ReportTable = ({ isLoading, rows, total, page, columns, emptyLabel, rowKey }) => (
  <section className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-white">
    {isLoading ? (
      <p className="p-5 text-on-surface-variant">Loading...</p>
    ) : total === 0 ? (
      <p className="p-5 text-on-surface-variant">{emptyLabel}</p>
    ) : (
      <div className="overflow-x-auto">
        <div className="border-b border-outline-variant px-4 py-2 text-xs text-on-surface-variant">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className="px-4 py-3">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-outline-variant">
                {columns.map((c) => (
                  <td key={c.label} className="px-4 py-3">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

// ---------------------------------------------------------------------------
// Config-driven workspace for the other reports.
// ---------------------------------------------------------------------------

const ReportWorkspace = ({ token, config }) => {
  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: config.queryKey,
    queryFn: () => config.fetcher(token),
    enabled: !!token,
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selects, setSelects] = useState({});
  const [page, setPage] = useState(1);

  const options = useMemo(() => {
    const map = {};
    for (const f of config.selectFilters) {
      map[f.key] = [
        ...new Set(rows.map((r) => r[f.key]).filter((v) => v != null && v !== "")),
      ].sort();
    }
    return map;
  }, [rows, config.selectFilters]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (config.dateField) {
          const day = r[config.dateField] ? String(r[config.dateField]).slice(0, 10) : "";
          if (from && (!day || day < from)) return false;
          if (to && (!day || day > to)) return false;
        }
        for (const f of config.selectFilters) {
          const v = selects[f.key];
          if (v && String(r[f.key]) !== v) return false;
        }
        return true;
      }),
    [rows, from, to, selects, config],
  );

  const filterKey = `${from}|${to}|${JSON.stringify(selects)}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setPage(1);
  }

  const kpis = useMemo(() => config.kpis(filtered), [filtered, config]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("Nothing to export for these filters.");
      return;
    }
    const filterPairs = [
      ...(config.dateField ? [["Date range", `${from || "start"} to ${to || "now"}`]] : []),
      ...config.selectFilters.map((f) => [f.label, selects[f.key] || "All"]),
    ];
    downloadCsv(
      `${config.filename}-${new Date().toISOString().slice(0, 10)}.csv`,
      `${metaCsv(config.reportName, filterPairs, filtered.length)}\n\n${toCsv(filtered, config.columns)}`,
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {config.dateField ? (
          <>
            <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
              From
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
              To
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </label>
          </>
        ) : null}
        {config.selectFilters.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs font-semibold text-on-surface-variant">
            {f.label}
            <select
              value={selects[f.key] || ""}
              onChange={(e) => setSelects((c) => ({ ...c, [f.key]: e.target.value }))}
              className={inputClass}
            >
              <option value="">All</option>
              {options[f.key].map((value) => (
                <option key={value} value={value}>
                  {f.format ? f.format(value) : value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={handleExport}
          className="ml-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          Export CSV
        </button>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load report"}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <SummaryCard key={kpi.label} label={kpi.label} value={isLoading ? "—" : kpi.value} accent={kpi.accent} />
        ))}
      </div>

      <ReportTable
        isLoading={isLoading}
        rows={pageRows}
        total={filtered.length}
        page={page}
        columns={config.previewColumns}
        emptyLabel="No rows match these filters."
        rowKey={config.rowKey}
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
};

const USER_TONE = { approved: "success", pending: "warning", suspended: "warning", rejected: "danger" };
const PAYMENT_TONE = { paid: "success", pending: "warning", failed: "danger", refunded: "neutral" };
const PRODUCT_TONE = {
  Available: "success",
  Reserved: "info",
  Claimed: "primary",
  Sold: "neutral",
  Pending: "warning",
  Cancelled: "danger",
};

const USERS_CONFIG = {
  queryKey: ["report-users"],
  fetcher: (token) => getUsersByRole({ role: undefined, token }).then((d) => d.users || []),
  reportName: "Users",
  filename: "users-report",
  dateField: "created_at",
  selectFilters: [
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "institution_name", label: "Institution" },
  ],
  kpis: (rows) => [
    { label: "Users", value: rows.length, accent: "text-primary" },
    { label: "Approved", value: rows.filter((u) => u.status === "approved").length },
    { label: "Pending", value: rows.filter((u) => u.status === "pending").length },
  ],
  columns: [
    { label: "Name", get: (u) => u.full_name },
    { label: "Email", get: (u) => u.email },
    { label: "Contact", get: (u) => u.contact_number },
    { label: "Role", get: (u) => u.role },
    { label: "Status", get: (u) => u.status },
    { label: "Institution", get: (u) => u.institution_name },
    { label: "Joined", get: (u) => formatDate(u.created_at) },
  ],
  previewColumns: [
    { label: "Name", render: (u) => <span className="font-semibold text-on-surface">{u.full_name}</span> },
    { label: "Email", render: (u) => u.email },
    { label: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
    { label: "Status", render: (u) => <Badge tone={USER_TONE[u.status] || "neutral"} className="capitalize">{u.status}</Badge> },
    { label: "Institution", render: (u) => u.institution_name || "—" },
    { label: "Joined", render: (u) => formatDate(u.created_at) },
  ],
  rowKey: (u) => u.id || u.email,
};

const INVENTORY_CONFIG = {
  queryKey: ["report-inventory"],
  fetcher: (token) => getAdminProducts({ token }).then((d) => d.products || []),
  reportName: "Inventory",
  filename: "inventory-report",
  dateField: null,
  selectFilters: [
    { key: "status", label: "Status" },
    { key: "listing_type", label: "Listing" },
    { key: "schoolName", label: "School" },
    { key: "category", label: "Category" },
  ],
  kpis: (rows) => [
    { label: "Products", value: rows.length, accent: "text-primary" },
    { label: "Total value", value: zar.format(rows.reduce((s, p) => s + Number(p.price || 0), 0)) },
    { label: "Available", value: rows.filter((p) => p.status === "Available").length },
  ],
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
  previewColumns: [
    { label: "Name", render: (p) => <span className="font-semibold text-on-surface">{p.name}</span> },
    { label: "Reference", render: (p) => <span className="text-xs text-on-surface-variant">{p.reference_number}</span> },
    { label: "School", render: (p) => p.schoolName },
    { label: "Listing", render: (p) => p.listing_type },
    { label: "Status", render: (p) => <Badge tone={PRODUCT_TONE[p.status] || "neutral"}>{p.status}</Badge> },
    { label: "Price", render: (p) => <span className="font-bold">R{p.price}</span> },
  ],
  rowKey: (p) => p.id || p.reference_number,
};

const PAYMENTS_CONFIG = {
  queryKey: ["report-payments"],
  fetcher: (token) => getPayments({ token }).then((d) => d.payments || []),
  reportName: "Payments",
  filename: "payments-report",
  dateField: "paid_at",
  selectFilters: [
    { key: "status", label: "Status" },
    { key: "payment_method", label: "Method" },
    { key: "institution_name", label: "School" },
  ],
  kpis: (rows) => [
    { label: "Payments", value: rows.length, accent: "text-primary" },
    { label: "Total amount", value: zar.format(rows.reduce((s, p) => s + Number(p.amount || 0), 0)) },
    { label: "Paid", value: rows.filter((p) => p.status === "paid").length },
  ],
  columns: [
    { label: "Order Reference", get: (p) => p.order_reference },
    { label: "Customer", get: (p) => p.user_full_name },
    { label: "Email", get: (p) => p.user_email },
    { label: "School", get: (p) => p.institution_name },
    { label: "Status", get: (p) => p.status },
    { label: "Method", get: (p) => p.payment_method },
    { label: "Amount (R)", get: (p) => p.amount },
    { label: "PayFast Ref", get: (p) => p.provider_payment_id },
    { label: "Paid At", get: (p) => formatDate(p.paid_at) },
  ],
  previewColumns: [
    { label: "Order", render: (p) => <span className="font-semibold text-on-surface">{p.order_reference}</span> },
    { label: "Customer", render: (p) => p.user_full_name },
    { label: "School", render: (p) => p.institution_name },
    { label: "Status", render: (p) => <Badge tone={PAYMENT_TONE[p.status] || "neutral"} className="capitalize">{p.status}</Badge> },
    { label: "Method", render: (p) => p.payment_method },
    { label: "Amount", render: (p) => <span className="font-bold">R{p.amount}</span> },
    { label: "Paid At", render: (p) => formatDate(p.paid_at) },
  ],
  rowKey: (p) => p.id || `${p.order_reference}-${p.provider_payment_id}`,
};

const CONFIGS = {
  users: USERS_CONFIG,
  inventory: INVENTORY_CONFIG,
  payments: PAYMENTS_CONFIG,
};

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "inventory", label: "Inventory" },
  { key: "payments", label: "Payments" },
];

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
          <ReportWorkspace token={token} config={CONFIGS[tab]} />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
