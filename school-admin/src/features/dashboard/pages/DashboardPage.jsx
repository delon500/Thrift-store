import { Link } from "react-router-dom";
import {
  PackageCheck,
  Clock,
  CircleCheckBig,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { PageHeader, SummaryCard, cardClass } from "../../../components/shared/ui";
import { useDashboard } from "../hooks/useDashboard";
import { useReadyOrders } from "../../collections/hooks/useCollections";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const DashboardPage = () => {
  const { data, isLoading, isError } = useDashboard();
  const { data: readyOrders = [], isLoading: readyLoading } = useReadyOrders();
  const stats = data?.stats;
  const recent = data?.recent || [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today at the collection desk." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Ready to collect"
          value={isLoading ? "—" : (stats?.ready_count ?? 0)}
          accent="text-primary"
          Icon={PackageCheck}
        />
        <SummaryCard
          label="Value waiting"
          value={isLoading ? "—" : `R${stats?.ready_value ?? 0}`}
          Icon={Wallet}
        />
        <SummaryCard
          label="Collected today"
          value={isLoading ? "—" : (stats?.collected_today ?? 0)}
          Icon={Clock}
        />
        <SummaryCard
          label="Collected (all time)"
          value={isLoading ? "—" : (stats?.collected_total ?? 0)}
          Icon={CircleCheckBig}
        />
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          Could not load the dashboard.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-on-surface">Ready for collection</h2>
            <Link
              to="/school/collections"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Open collections <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <p className="text-xs text-on-surface-variant">
            Paid orders awaiting pickup
          </p>
          <div className="mt-4 grid gap-2">
            {readyLoading ? (
              <p className="text-sm text-on-surface-variant">Loading...</p>
            ) : readyOrders.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Nothing waiting right now.
              </p>
            ) : (
              readyOrders.slice(0, 6).map((order) => (
                <Link
                  key={order.order_reference}
                  to="/school/collections"
                  className="flex items-center justify-between rounded-xl border border-outline-variant p-3 text-sm transition-colors hover:bg-surface-container-low"
                >
                  <div>
                    <p className="font-bold text-on-surface">
                      {order.order_reference}
                    </p>
                    <p className="text-on-surface-variant">
                      {order.user_full_name}
                    </p>
                  </div>
                  <span className="font-bold text-primary">R{order.total}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="font-bold text-on-surface">Recent collections</h2>
          <p className="text-xs text-on-surface-variant">Last items handed over</p>
          <div className="mt-4 grid gap-2">
            {isLoading ? (
              <p className="text-sm text-on-surface-variant">Loading...</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No collections yet.
              </p>
            ) : (
              recent.map((order) => (
                <div
                  key={order.order_reference}
                  className="flex items-center justify-between rounded-xl border border-outline-variant p-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-on-surface">
                      {order.order_reference}
                    </p>
                    <p className="text-on-surface-variant">
                      {order.user_full_name}
                    </p>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {formatDateTime(order.collected_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
