import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, X, MapPin } from "lucide-react";
import { useMyOrder, useResumeOrder } from "../hooks/useOrders";
import { submitToPayfast } from "../lib/submitToPayfast";
import { formatPrice } from "../../../lib/money";
import { Skeleton } from "../../../components/shared/Skeleton";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const STATUS_META = {
  payment_pending: { label: "Awaiting payment", cls: "bg-tertiary-container text-on-tertiary-container" },
  payment_failed: { label: "Payment failed", cls: "bg-error-container text-on-error-container" },
  paid: { label: "Paid", cls: "bg-primary-container text-on-primary-container" },
  ready_for_collection: { label: "Ready to collect", cls: "bg-primary-container text-on-primary-container" },
  collected: { label: "Collected", cls: "bg-surface-container-high text-on-surface-variant" },
  cancelled: { label: "Cancelled", cls: "bg-surface-container-high text-on-surface-variant" },
  expired: { label: "Expired", cls: "bg-surface-container-high text-on-surface-variant" },
};

const STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "paid", label: "Payment confirmed" },
  { key: "ready", label: "Ready to collect" },
  { key: "collected", label: "Collected" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

const stepState = (status, index) => {
  if (status === "collected") return "done";
  if (status === "ready_for_collection" || status === "paid") {
    if (index <= 1) return "done";
    if (index === 2) return "active";
    return "todo";
  }
  if (status === "payment_pending") {
    if (index === 0) return "done";
    if (index === 1) return "active";
    return "todo";
  }
  if (status === "payment_failed") {
    if (index === 0) return "done";
    if (index === 1) return "failed";
    return "todo";
  }
  if (status === "cancelled" || status === "expired") {
    return index === 0 ? "done" : "todo";
  }
  return index === 0 ? "done" : "todo";
};

const StepDot = ({ state }) => {
  if (state === "done")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary">
        <Check size={15} aria-hidden="true" />
      </span>
    );
  if (state === "failed")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error text-on-error">
        <X size={15} aria-hidden="true" />
      </span>
    );
  if (state === "active")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-surface">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </span>
    );
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high">
      <span className="h-2 w-2 rounded-full bg-on-surface-variant/50" />
    </span>
  );
};

const OrderDetail = () => {
  const { orderReference } = useParams();
  const { data: order, isLoading, isError } = useMyOrder(orderReference);
  const resumeMutation = useResumeOrder();
  useDocumentTitle(orderReference);

  const handleResume = async () => {
    try {
      const checkout = await resumeMutation.mutateAsync(orderReference);
      submitToPayfast(checkout.payment_gateway);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not resume payment");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Order not found</h1>
        <Link
          to="/orders"
          className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status] || { label: order.status, cls: "bg-surface-container-high text-on-surface-variant" };
  const readyToCollect = order.status === "ready_for_collection" || order.status === "paid";
  const isPending = order.status === "payment_pending";

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link
        to="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        My orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
            {order.order_reference}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
            <MapPin size={15} aria-hidden="true" />
            Collect from {order.institution_name}
          </p>
          <p className="text-sm text-on-surface-variant">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${meta.cls}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <section className="rounded-2xl border border-outline-variant bg-surface p-6">
            <h2 className="text-lg font-bold text-on-surface">Progress</h2>
            <ol className="mt-5">
              {STEPS.map((step, index) => {
                const state = stepState(order.status, index);
                const last = index === STEPS.length - 1;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <StepDot state={state} />
                      {!last ? (
                        <span
                          className={`my-1 w-0.5 flex-1 ${
                            state === "done" ? "bg-primary" : "bg-outline-variant"
                          }`}
                        />
                      ) : null}
                    </div>
                    <div className={last ? "" : "pb-6"}>
                      <p
                        className={`font-semibold ${
                          state === "todo"
                            ? "text-on-surface-variant"
                            : state === "failed"
                              ? "text-error"
                              : "text-on-surface"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.key === "placed" ? (
                        <p className="text-sm text-on-surface-variant">
                          {formatDate(order.created_at)}
                        </p>
                      ) : null}
                      {step.key === "ready" && state === "active" ? (
                        <p className="text-sm text-on-surface-variant">
                          Show your reference at {order.institution_name}.
                        </p>
                      ) : null}
                      {step.key === "paid" && state === "failed" ? (
                        <p className="text-sm text-error">
                          The payment didn't go through.
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            {isPending ? (
              <button
                type="button"
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="mt-2 w-full rounded-full bg-primary py-3 font-semibold text-on-primary hover:bg-on-primary-container disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {resumeMutation.isPending ? "Loading..." : "Continue to payment"}
              </button>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-outline-variant bg-surface p-6">
            <h2 className="text-lg font-bold text-on-surface">Items</h2>
            <div className="mt-4 grid gap-3">
              {order.items.map((item) => (
                <div
                  key={item.reference_number}
                  className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3"
                >
                  <img
                    src={item.image || ""}
                    alt={item.product_name}
                    className="h-14 w-14 shrink-0 rounded-lg border border-outline-variant bg-surface object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-on-surface">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {item.listing_type} · {item.reference_number}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-on-surface">
                    {formatPrice(item.unit_price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2 border-t border-outline-variant pt-4 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Service fee</span>
                <span>{formatPrice(order.service_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-on-surface">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-outline-variant bg-surface p-6 text-center lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-on-surface">Collection pass</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {readyToCollect
              ? "Show this at the school to collect."
              : "Available once payment is confirmed."}
          </p>
          <div
            className={`mx-auto mt-5 w-fit rounded-2xl border border-outline-variant bg-white p-4 ${
              readyToCollect ? "" : "opacity-40"
            }`}
          >
            <QRCodeSVG
              value={order.order_reference}
              size={168}
              fgColor="#17150f"
              bgColor="#ffffff"
              aria-label={`QR code for ${order.order_reference}`}
            />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Reference
          </p>
          <p className="text-lg font-bold tracking-wide text-on-surface">
            {order.order_reference}
          </p>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetail;
