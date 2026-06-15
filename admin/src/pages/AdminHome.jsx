import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../features/orders/hooks/useOrders";
import { useInventory } from "../features/inventory/hooks/useInventory";
import { useRegistrations } from "../features/registrations/hooks/useRegistrations";

const money = (amount) =>
  Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const StatCard = ({ label, value, hint, to, accent }) => {
  const card = (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className={`text-3xl font-black ${accent || "text-gray-800"}`}>
        {value}
      </span>
      {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
    </div>
  );

  return to ? <Link to={to}>{card}</Link> : card;
};

const Breakdown = ({ title, counts }) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-black text-gray-700">{title}</h2>
      <div className="mt-4 grid gap-2">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400">No data yet.</p>
        ) : (
          entries.map(([key, count]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{formatStatus(key)}</span>
              <span className="font-bold text-gray-800">{count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminHome = () => {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: products = [], isLoading: productsLoading } = useInventory();
  const { data: registrations = [] } = useRegistrations();

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.payment_status === "paid")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const inventoryByStatus = products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {});

    return {
      revenue,
      readyForCollection: ordersByStatus.ready_for_collection || 0,
      availableItems: inventoryByStatus.Available || 0,
      ordersByStatus,
      inventoryByStatus,
    };
  }, [orders, products]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-teal-600">Dashboard</h1>
        <p className="text-sm font-medium text-gray-500">
          An overview of sales, collections, inventory, and sign-ups.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={`R${money(stats.revenue)}`}
          hint="From paid orders"
          to="/admin/orders"
          accent="text-teal-600"
        />
        <StatCard
          label="Ready for collection"
          value={ordersLoading ? "…" : stats.readyForCollection}
          hint="Awaiting pickup"
          to="/admin/orders"
        />
        <StatCard
          label="Pending approvals"
          value={registrations.length}
          hint="Sign-ups to review"
          to="/admin/registrations"
          accent={registrations.length > 0 ? "text-amber-600" : "text-gray-800"}
        />
        <StatCard
          label="Available items"
          value={productsLoading ? "…" : stats.availableItems}
          hint="Live in the store"
          to="/admin/inventory"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-black text-gray-700">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-teal-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {ordersLoading ? (
            <p className="px-5 pb-5 text-sm text-gray-500">Loading orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-2">Reference</th>
                    <th className="px-5 py-2">Customer</th>
                    <th className="px-5 py-2">Status</th>
                    <th className="px-5 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.order_reference} className="border-t border-gray-100">
                      <td className="px-5 py-3 font-bold text-teal-700">
                        {order.order_reference}
                      </td>
                      <td className="px-5 py-3">{order.user_full_name}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            statusStyles[order.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold">R{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-4">
          <Breakdown title="Orders by status" counts={stats.ordersByStatus} />
          <Breakdown title="Inventory by status" counts={stats.inventoryByStatus} />
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
