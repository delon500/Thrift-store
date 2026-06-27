import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Package,
  CircleCheckBig,
  Mail,
  Calendar,
  Receipt,
} from "lucide-react";
import { PageHeader, Badge, cardClass } from "../../../components/shared/ui";
import { useOrder } from "../hooks/useOrders";
import { useMarkCollected } from "../../collections/hooks/useCollections";
import { STATUS_TONE, formatStatus } from "../lib/orderStatus";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const OrderDetailPage = () => {
  const { orderReference } = useParams();
  const { data: order, isLoading, isError, error } = useOrder(orderReference);
  const collect = useMarkCollected();

  const collectable =
    order && ["ready_for_collection", "paid"].includes(order.status);

  const handleCollect = async () => {
    try {
      await collect.mutateAsync(order.order_reference);
      toast.success(`${order.order_reference} marked as collected.`);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not mark as collected",
      );
    }
  };

  return (
    <div>
      <Link
        to="/school/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to orders
      </Link>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading order...</p>
      ) : isError ? (
        <p className="text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load this order"}
        </p>
      ) : !order ? (
        <p className="text-on-surface-variant">Order not found.</p>
      ) : (
        <>
          <PageHeader title={order.order_reference}>
            <Badge tone={STATUS_TONE[order.status] || "neutral"}>
              {formatStatus(order.status)}
            </Badge>
          </PageHeader>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
            <section className={`${cardClass} p-6`}>
              <h2 className="font-bold text-on-surface">Items</h2>
              <div className="mt-4 grid gap-3">
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
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-on-surface">
                        R{item.unit_price}
                      </p>
                      <Badge tone={STATUS_TONE[item.item_status] || "neutral"}>
                        {formatStatus(item.item_status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {order.collection_note ? (
                <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
                  Note: {order.collection_note}
                </p>
              ) : null}

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
            </section>

            <aside className={`h-fit ${cardClass} p-6`}>
              <h2 className="font-bold text-on-surface">Buyer & order</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    Buyer
                  </dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {order.user_full_name}
                  </dd>
                  <dd className="flex items-center gap-1.5 text-on-surface-variant">
                    <Mail size={14} aria-hidden="true" /> {order.user_email}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    <Receipt size={14} aria-hidden="true" /> Total
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-primary">
                    R{order.total}
                  </dd>
                  {order.payment_status ? (
                    <dd className="text-on-surface-variant">
                      Payment: {formatStatus(order.payment_status)}
                    </dd>
                  ) : null}
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    <Calendar size={14} aria-hidden="true" /> Placed
                  </dt>
                  <dd className="mt-1 text-on-surface">
                    {formatDateTime(order.created_at)}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderDetailPage;
