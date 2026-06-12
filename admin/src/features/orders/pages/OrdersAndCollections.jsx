import { useMemo, useState } from "react";
import {
  useMarkOrderCollected,
  useOrder,
  useOrders,
} from "../hooks/useOrders";

const statusStyles = {
  payment_pending: "bg-yellow-100 text-yellow-800",
  ready_for_collection: "bg-teal-100 text-teal-800",
  collected: "bg-green-100 text-green-800",
  payment_failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

const formatStatus = (status) =>
  status
    ? status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Unknown";

const OrdersAndCollections = () => {
  const { data: orders = [], isLoading, isError, error } = useOrders();
  const [query, setQuery] = useState("");
  const [selectedReference, setSelectedReference] = useState("");
  const { data: selectedOrder } = useOrder(selectedReference);
  const markCollectedMutation = useMarkOrderCollected();

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return orders;

    return orders.filter((order) =>
      [
        order.order_reference,
        order.user_full_name,
        order.user_email,
        order.institution_name,
        order.payment_method,
        order.status,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [orders, query]);

  const handleCollect = async () => {
    try {
      await markCollectedMutation.mutateAsync(selectedOrder.order_reference);
      alert("Order marked as collected");
    } catch (collectError) {
      alert(
        collectError?.response?.data?.message ||
          "Could not mark order as collected",
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">
          Orders & Collections
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Track payments, verify references, and mark school collections.
        </p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-6 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
        placeholder="Search by order reference, user, email, school, payment method..."
      />

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load orders"}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <p className="p-5 text-gray-500">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="p-5 text-gray-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.order_reference}
                      onClick={() => setSelectedReference(order.order_reference)}
                      className="cursor-pointer border-t border-gray-100 hover:bg-teal-50"
                    >
                      <td className="px-4 py-4 font-bold text-teal-700">
                        {order.order_reference}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{order.user_full_name}</p>
                        <p className="text-xs text-gray-500">
                          {order.user_email}
                        </p>
                      </td>
                      <td className="px-4 py-4">{order.institution_name}</td>
                      <td className="px-4 py-4">
                        <p>{formatStatus(order.payment_status)}</p>
                        <p className="text-xs text-gray-500">
                          {formatStatus(order.payment_method)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            statusStyles[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold">R{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
          {selectedOrder ? (
            <>
              <p className="text-xs font-bold uppercase text-teal-600">
                Selected order
              </p>
              <h2 className="mt-2 text-xl font-black">
                {selectedOrder.order_reference}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedOrder.user_full_name} · {selectedOrder.user_email}
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                <p>
                  <span className="font-bold">School:</span>{" "}
                  {selectedOrder.institution_name}
                </p>
                <p>
                  <span className="font-bold">Payment:</span>{" "}
                  {formatStatus(selectedOrder.payment_status)} via{" "}
                  {formatStatus(selectedOrder.payment_method)}
                </p>
                <p>
                  <span className="font-bold">Collection status:</span>{" "}
                  {formatStatus(selectedOrder.status)}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm"
                  >
                    <p className="font-bold">{item.product_name}</p>
                    <p>Item reference: {item.product_reference_number}</p>
                    <p>{formatStatus(item.item_status)}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCollect}
                disabled={
                  selectedOrder.status === "collected" ||
                  markCollectedMutation.isPending
                }
                className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markCollectedMutation.isPending
                  ? "Updating..."
                  : "Mark as collected"}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Select an order to view references, payment state, and collection
              actions.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrdersAndCollections;
