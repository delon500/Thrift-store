import { useState } from "react";
import { toast } from "react-toastify";
import {
  usePayment,
  usePayments,
  useRecoverPayment,
} from "../hooks/usePayments";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import Pagination from "../../../components/shared/Pagination";
import {
  Badge,
  inputClass,
  Modal,
  PageHeader,
  rowClass,
  SummaryCard,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
} from "../../../components/shared/ui";
import { useMe } from "../../auth/hook/useAuth";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["paid", "pending", "failed", "cancelled", "refunded"];
const STATUS_TONE = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

const money = (amount) =>
  Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const StatusBadge = ({ status }) => (
  <Badge tone={STATUS_TONE[status] || "neutral"} className="capitalize">
    {status}
  </Badge>
);

const Field = ({ label, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</p>
    <p className="font-semibold text-on-surface">{children ?? "—"}</p>
  </div>
);

const PaymentDetailModal = ({ paymentId, canRecover, onClose }) => {
  const { data: payment, isLoading } = usePayment(paymentId);
  const recoverMutation = useRecoverPayment();
  const [showRaw, setShowRaw] = useState(false);

  const handleRecover = async () => {
    if (!window.confirm(`Mark ${payment.order_reference} as paid (recover)?`)) return;
    try {
      await recoverMutation.mutateAsync(payment.order_reference);
      toast.success(`${payment.order_reference} marked paid`);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not recover payment");
    }
  };

  const recoverable =
    payment && (payment.status === "pending" || payment.status === "failed");

  return (
    <Modal title="Payment" onClose={onClose}>
      {isLoading || !payment ? (
        <p className="mt-6 text-on-surface-variant">Loading...</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <h3 className="text-lg font-bold text-on-surface">
              {payment.order_reference}
            </h3>
            <StatusBadge status={payment.status} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Field label="Amount">
              {payment.currency} {money(payment.amount)}
            </Field>
            <Field label="Provider">{payment.provider}</Field>
            <Field label="Method">{payment.payment_method}</Field>
            <Field label="PayFast ref">{payment.provider_payment_id}</Field>
            <Field label="Order status">{payment.order_status}</Field>
            <Field label="Institution">{payment.institution_name}</Field>
            <Field label="Customer">{payment.user_full_name}</Field>
            <Field label="Email">{payment.user_email}</Field>
            <Field label="Created">{formatDateTime(payment.created_at)}</Field>
            <Field label="Paid at">{formatDateTime(payment.paid_at)}</Field>
            <Field label="Failed at">{formatDateTime(payment.failed_at)}</Field>
            <Field label="Refunded at">{formatDateTime(payment.refunded_at)}</Field>
          </div>

          {payment.failure_reason ? (
            <p className="mt-4 rounded-lg bg-error-container/50 p-3 text-sm text-on-error-container">
              Failure: {payment.failure_reason}
            </p>
          ) : null}
          {payment.refund_reason ? (
            <p className="mt-2 rounded-lg bg-tertiary-container/50 p-3 text-sm text-on-tertiary-container">
              Refund: {payment.refund_reason}
            </p>
          ) : null}

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowRaw((value) => !value)}
              className="text-sm font-bold text-primary hover:underline"
            >
              {showRaw ? "Hide" : "Show"} raw provider payload
            </button>
            {showRaw ? (
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-inverse-surface p-4 text-xs text-inverse-on-surface">
                {JSON.stringify(payment.raw_webhook_payload ?? {}, null, 2)}
              </pre>
            ) : null}
          </div>

          {canRecover && recoverable ? (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleRecover}
                disabled={recoverMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-on-primary-container disabled:opacity-60"
              >
                {recoverMutation.isPending ? "Recovering..." : "Mark paid (recover)"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
};

const PaymentsPage = () => {
  const { data: me } = useMe();
  const canRecover = me?.role === "super_admin";
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const debouncedQuery = useDebouncedValue(query);

  const filterKey = `${debouncedQuery}|${statusFilter}|${from}|${to}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = usePayments({
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    from: from || undefined,
    to: to || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const payments = data?.payments || [];
  const total = data?.total || 0;
  const summary = data?.summary || {};
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Confirm payments, reconcile, and investigate failures & refunds."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Paid" value={`R${money(summary.total_paid)}`} accent="text-primary" />
        <SummaryCard label="Refunded" value={`R${money(summary.total_refunded)}`} accent="text-tertiary" />
        <SummaryCard
          label="Failed"
          value={summary.failed_count || 0}
          accent={summary.failed_count ? "text-error" : "text-on-surface"}
        />
        <SummaryCard label="Pending" value={summary.pending_count || 0} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order / PayFast ref / email..."
          className={inputClass}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputClass}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} aria-label="From date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} aria-label="To date" />
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load payments"}
        </p>
      ) : null}

      <section className={`mt-6 ${tableWrapClass}`}>
        {isLoading ? (
          <p className="p-5 text-on-surface-variant">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="p-5 text-on-surface-variant">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Order</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Method</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Paid / Failed</th>
                  <th className={thClass}>PayFast ref</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedId(payment.id)}
                    className={`cursor-pointer ${rowClass}`}
                  >
                    <td className={`${tdClass} font-bold text-primary`}>
                      {payment.order_reference}
                    </td>
                    <td className={tdClass}>
                      <p className="font-semibold text-on-surface">{payment.user_full_name}</p>
                      <p className="text-xs text-on-surface-variant">{payment.user_email}</p>
                    </td>
                    <td className={`${tdClass} capitalize`}>{payment.payment_method}</td>
                    <td className={tdClass}>
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className={`${tdClass} font-bold`}>
                      {payment.currency} {money(payment.amount)}
                    </td>
                    <td className={`${tdClass} text-on-surface-variant`}>
                      {formatDateTime(payment.paid_at || payment.failed_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      {payment.provider_payment_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {selectedId ? (
        <PaymentDetailModal
          paymentId={selectedId}
          canRecover={canRecover}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
};

export default PaymentsPage;
