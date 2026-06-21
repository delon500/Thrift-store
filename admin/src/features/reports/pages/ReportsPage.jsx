import { useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "../../auth/store/authStore";
import { getOrders } from "../../orders/api/orderApi";
import { getUsersByRole } from "../../registeredUsers/api/registeredUsersApi";
import { getAdminProducts } from "../../inventory/api/inventoryApi";
import { getPayments } from "../../payments/api/paymentsApi";
import { downloadCsv, toCsv } from "../lib/csv";

const REPORTS = [
  {
    key: "orders",
    name: "Orders report",
    description:
      "Every collection order with customer, school, status, payment, and total.",
    fetcher: (token) => getOrders({ token }).then((data) => data.orders),
    columns: [
      { label: "Order Reference", get: (o) => o.order_reference },
      { label: "Customer", get: (o) => o.user_full_name },
      { label: "Email", get: (o) => o.user_email },
      { label: "School", get: (o) => o.institution_name },
      { label: "Status", get: (o) => o.status },
      { label: "Payment", get: (o) => o.payment_status },
      { label: "Method", get: (o) => o.payment_method },
      { label: "Total (R)", get: (o) => o.total },
    ],
  },
  {
    key: "users",
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
  {
    key: "inventory",
    name: "Inventory report",
    description: "All products across schools with status, price, and condition.",
    fetcher: (token) =>
      getAdminProducts({ token }).then((data) => data.products),
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
  {
    key: "payments",
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
];

const ReportsPage = () => {
  const token = useAuthStore((state) => state.token);
  const [busy, setBusy] = useState(null);

  const handleDownload = async (report) => {
    setBusy(report.key);

    try {
      const data = await report.fetcher(token);
      const csv = toCsv(data || [], report.columns);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`${report.key}-report-${date}.csv`, csv);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not generate the report");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-primary">Reports</h1>
        <p className="text-sm font-medium text-on-surface-variant">
          Download CSV exports you can open in Excel or Google Sheets.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <div
            key={report.key}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-6"
          >
            <div>
              <h2 className="text-lg font-black text-on-surface">{report.name}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{report.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload(report)}
              disabled={busy === report.key}
              className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === report.key ? "Preparing..." : "Download CSV"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
