import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLogs, useStats } from "../features/dashboard/hooks/useDashboard";

const PIE_COLORS = ["#0d9488", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];

const money = (amount) =>
  Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ACTION_LABELS = {
  "user.login": { label: "Login", cls: "bg-sky-100 text-sky-700" },
  "user.register": { label: "Registration", cls: "bg-teal-100 text-teal-700" },
  "registration.approved": { label: "Approved", cls: "bg-green-100 text-green-700" },
  "registration.rejected": { label: "Rejected", cls: "bg-red-100 text-red-700" },
  "order.created": { label: "Order created", cls: "bg-amber-100 text-amber-700" },
  "order.paid": { label: "Order paid", cls: "bg-emerald-100 text-emerald-700" },
  "order.cancelled": { label: "Order cancelled", cls: "bg-gray-100 text-gray-600" },
  "order.expired": { label: "Order expired", cls: "bg-gray-100 text-gray-600" },
  "order.collected": { label: "Collected", cls: "bg-green-100 text-green-700" },
  "product.created": { label: "Product added", cls: "bg-teal-100 text-teal-700" },
  "product.updated": { label: "Product updated", cls: "bg-sky-100 text-sky-700" },
  "product.deleted": { label: "Product deleted", cls: "bg-red-100 text-red-700" },
  "user.updated": { label: "User updated", cls: "bg-sky-100 text-sky-700" },
  "user.suspended": { label: "User suspended", cls: "bg-orange-100 text-orange-700" },
  "user.password_reset": { label: "Password reset", cls: "bg-gray-100 text-gray-600" },
  "user.deleted": { label: "User deleted", cls: "bg-red-100 text-red-700" },
  "order.refunded": { label: "Order refunded", cls: "bg-red-100 text-red-700" },
  "institution.updated": { label: "Institution updated", cls: "bg-sky-100 text-sky-700" },
  "institution.suspended": { label: "Institution suspended", cls: "bg-orange-100 text-orange-700" },
  "institution.deleted": { label: "Institution deleted", cls: "bg-red-100 text-red-700" },
};

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

const StatCard = ({ label, value, accent, to }) => {
  const card = (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${accent || "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );

  return to ? <Link to={to}>{card}</Link> : card;
};

const Panel = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
    <h2 className="mb-4 text-sm font-black text-gray-700">{title}</h2>
    {children}
  </div>
);

const AdminHome = () => {
  const { data: stats, isLoading } = useStats();
  const { data: logsData } = useLogs(15);
  const logs = logsData?.logs || [];

  const activityData = useMemo(
    () =>
      (stats?.timeseries || []).map((d) => ({
        day: d.day.slice(5),
        Orders: d.orders,
        Registrations: d.registrations,
        Logins: d.logins,
        Revenue: Number(d.revenue),
      })),
    [stats],
  );

  const usersPie = useMemo(
    () =>
      Object.entries(stats?.users?.by_role || {}).map(([role, value]) => ({
        name: role,
        value,
      })),
    [stats],
  );

  const ordersBar = useMemo(
    () =>
      Object.entries(stats?.orders?.by_status || {}).map(([status, count]) => ({
        status: status.replace(/_/g, " "),
        count,
      })),
    [stats],
  );

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  const users = stats?.users || {};
  const activity = stats?.activity || {};

  return (
    <div className="p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-teal-600">Dashboard</h1>
        <p className="text-sm font-medium text-gray-500">
          Users, activity, sales, and a live feed of everything happening.
        </p>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={users.total || 0}
          to="/admin/registered-users"
          accent="text-teal-600"
        />
        <StatCard
          label="Schools"
          value={users.schools || 0}
          to="/admin/registered-users/school"
        />
        <StatCard
          label="Universities"
          value={users.universities || 0}
          to="/admin/registered-users/university"
        />
        <StatCard
          label="Parents"
          value={users.parents || 0}
          to="/admin/registered-users/parent"
        />
        <StatCard
          label="Students"
          value={users.students || 0}
          to="/admin/registered-users/student"
        />
        <StatCard label="Logins" value={activity.logins || 0} />
        <StatCard
          label="Public registrations"
          value={activity.registrations || 0}
        />
        <StatCard
          label="Revenue (paid)"
          value={`R${money(stats?.orders?.revenue)}`}
          accent="text-teal-600"
          to="/admin/orders"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Activity (last 14 days)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Orders" stroke="#0d9488" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Registrations" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Logins" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Users by type">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usersPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {usersPie.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue (last 14 days)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(value) => `R${money(value)}`} />
                <Bar dataKey="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Orders by status">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersBar} layout="vertical">
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="status" width={110} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Activity feed */}
      <div className="mt-6">
        <Panel title="Activity log">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          ) : (
            <div className="grid gap-1">
              {logs.map((log) => {
                const meta =
                  ACTION_LABELS[log.action] || {
                    label: log.action,
                    cls: "bg-gray-100 text-gray-600",
                  };

                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center gap-3 border-b border-gray-50 py-2 text-sm last:border-b-0"
                  >
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                    <span className="flex-grow text-gray-700">
                      {log.description || log.entity_ref || "—"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default AdminHome;
