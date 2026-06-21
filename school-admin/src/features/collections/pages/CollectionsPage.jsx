import { useState } from "react";
import {
  ScanLine,
  Package,
  CircleCheckBig,
  CircleAlert,
  ArrowRight,
} from "lucide-react";
import {
  PageHeader,
  Badge,
  cardClass,
  inputClass,
} from "../../../components/shared/ui";
import {
  useLookup,
  useMarkCollected,
  useReadyOrders,
} from "../hooks/useCollections";

// Status → Badge tone. The QR pass printed by the customer app encodes the
// plain order_reference, so a future camera scanner can feed loadReference().
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
    : "Unknown";

const CollectionsPage = () => {
  const { data: readyOrders = [], isLoading } = useReadyOrders();
  const lookup = useLookup();
  const collect = useMarkCollected();
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState(null);

  const loadReference = async (value) => {
    const ref = value.trim();
    if (!ref) return;

    setMessage(null);
    setReference(ref);

    try {
      const found = await lookup.mutateAsync(ref);
      setOrder(found);
    } catch (error) {
      setOrder(null);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || "No order found for that reference",
      });
    }
  };

  const handleVerify = (event) => {
    event.preventDefault();
    loadReference(reference);
  };

  const handleCollect = async () => {
    try {
      await collect.mutateAsync(order.order_reference);
      setMessage({
        type: "success",
        text: `${order.order_reference} marked as collected.`,
      });
      setOrder(null);
      setReference("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Could not mark as collected",
      });
    }
  };

  const collectable =
    order && ["ready_for_collection", "paid"].includes(order.status);

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="Verify the reference the buyer presents, then hand over the items."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section>
          <form onSubmit={handleVerify} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <ScanLine
                size={20}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="ORD-2026-000001 or ITEM-…"
                aria-label="Order or item reference"
                className={`${inputClass} w-full py-3.5 pl-12 text-base`}
              />
            </div>
            <button
              type="submit"
              disabled={lookup.isPending}
              className="rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
            >
              {lookup.isPending ? "Checking..." : "Verify"}
            </button>
          </form>

          {message ? (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "border-primary-container bg-primary-container/50 text-on-primary-container"
                  : "border-error-container bg-error-container/40 text-on-error-container"
              }`}
            >
              {message.type === "success" ? (
                <CircleCheckBig size={18} aria-hidden="true" />
              ) : (
                <CircleAlert size={18} aria-hidden="true" />
              )}
              {message.text}
            </div>
          ) : null}

          {order ? (
            <div className={`mt-6 ${cardClass} p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-on-surface">
                    {order.order_reference}
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {order.user_full_name} · {order.user_email}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[order.status] || "neutral"}>
                  {formatStatus(order.status)}
                </Badge>
              </div>

              {order.collection_note ? (
                <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
                  Note: {order.collection_note}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                      <Package size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface">
                        {item.product_name}
                      </p>
                      <p className="text-on-surface-variant">
                        {item.listing_type} · {item.product_reference_number}
                      </p>
                    </div>
                    <Badge
                      tone={STATUS_TONE[item.item_status] || "neutral"}
                      className="shrink-0"
                    >
                      {formatStatus(item.item_status)}
                    </Badge>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCollect}
                disabled={!collectable || collect.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CircleCheckBig size={20} aria-hidden="true" />
                {collect.isPending
                  ? "Updating..."
                  : collectable
                    ? "Mark as collected"
                    : `Cannot collect (${formatStatus(order.status)})`}
              </button>
            </div>
          ) : null}
        </section>

        <aside className={`h-fit ${cardClass} p-5`}>
          <h2 className="font-bold text-on-surface">Ready for collection</h2>
          <p className="text-xs text-on-surface-variant">
            Paid orders awaiting pickup
          </p>

          <div className="mt-4 grid gap-2">
            {isLoading ? (
              <p className="text-sm text-on-surface-variant">Loading...</p>
            ) : readyOrders.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Nothing waiting right now.
              </p>
            ) : (
              readyOrders.map((readyOrder) => (
                <button
                  key={readyOrder.order_reference}
                  type="button"
                  onClick={() => loadReference(readyOrder.order_reference)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant p-3 text-left text-sm transition-colors hover:bg-surface-container-low"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-primary">
                      {readyOrder.order_reference}
                    </p>
                    <p className="truncate text-on-surface-variant">
                      {readyOrder.user_full_name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      R{readyOrder.total}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-on-surface-variant"
                  />
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CollectionsPage;
