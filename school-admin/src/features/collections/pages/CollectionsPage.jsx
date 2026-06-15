import { useState } from "react";
import {
  useLookup,
  useMarkCollected,
  useReadyOrders,
} from "../hooks/useCollections";

const statusStyles = {
  ready_for_collection: "bg-teal-100 text-teal-800",
  paid: "bg-emerald-100 text-emerald-800",
  collected: "bg-green-100 text-green-800",
  payment_pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-700",
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
        text: error?.response?.data?.message || "No order found for that reference",
      });
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
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
    <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <section>
        <h1 className="text-2xl font-black text-teal-600">Verify a collection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the order (ORD-…) or item (ITEM-…) reference the buyer presents.
        </p>

        <form onSubmit={handleVerify} className="mt-5 flex gap-3">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="ORD-2026-000001 or ITEM-…"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={lookup.isPending}
            className="rounded-lg bg-teal-600 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {lookup.isPending ? "Checking..." : "Verify"}
          </button>
        </form>

        {message ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {order ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-800">
                  {order.order_reference}
                </h2>
                <p className="text-sm text-gray-500">
                  {order.user_full_name} · {order.user_email}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  statusStyles[order.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {formatStatus(order.status)}
              </span>
            </div>

            {order.collection_note ? (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                Note: {order.collection_note}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm"
                >
                  <p className="font-bold text-gray-800">{item.product_name}</p>
                  <p className="text-gray-500">
                    {item.listing_type} · {item.product_reference_number}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-gray-400">
                    {formatStatus(item.item_status)}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCollect}
              disabled={!collectable || collect.isPending}
              className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {collect.isPending
                ? "Updating..."
                : collectable
                  ? "Mark as collected"
                  : `Cannot collect (${formatStatus(order.status)})`}
            </button>
          </div>
        ) : null}
      </section>

      <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-black text-gray-700">Ready for collection</h2>
        <p className="text-xs text-gray-400">Paid orders awaiting pickup</p>

        <div className="mt-4 grid gap-2">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : readyOrders.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing waiting right now.</p>
          ) : (
            readyOrders.map((readyOrder) => (
              <button
                key={readyOrder.order_reference}
                type="button"
                onClick={() => loadReference(readyOrder.order_reference)}
                className="rounded-lg border border-gray-100 p-3 text-left text-sm transition-colors hover:bg-teal-50"
              >
                <p className="font-bold text-teal-700">
                  {readyOrder.order_reference}
                </p>
                <p className="text-gray-600">{readyOrder.user_full_name}</p>
                <p className="text-xs text-gray-400">R{readyOrder.total}</p>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default CollectionsPage;
