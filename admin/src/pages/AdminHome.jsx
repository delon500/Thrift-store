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
import {
  Users,
  School,
  GraduationCap,
  User,
  LogIn,
  UserPlus,
  Banknote,
} from "lucide-react";
import { useLogs, useStats } from "../features/dashboard/hooks/useDashboard";

const CHART = {
  primary: "#0f7a52",
  sky: "#0ea5e9",
  accent: "#e8590c",
  grid: "#e8e3da",
};
const PIE_COLORS = ["#0f7a52", "#0ea5e9", "#e8590c", "#8b5cf6", "#f59e0b", "#64748b"];

const money = (amount) =>
  Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ACTION_LABELS = {
  "user.login": { label: "Login", cls: "bg-sky-100 text-sky-700" },
  "user.register": { label: "Registration", cls: "bg-primary-container text-on-primary-container" },
  "registration.approved": { label: "Approved", cls: "bg-green-100 text-green-700" },
  "registration.rejected": { label: "Rejected", cls: "bg-red-100 text-red-700" },
  "order.created": { label: "Order created", cls: "bg-amber-100 text-amber-700" },
  "order.paid": { label: "Order paid", cls: "bg-primary-container text-on-primary-container" },
  "order.cancelled": { label: "Order cancelled", cls: "bg-surface-container-high text-on-surface-variant" },
  "order.expired": { label: "Order expired", cls: "bg-surface-container-high text-on-surface-variant" },
  "order.collected": { label: "Collected", cls: "bg-green-100 text-green-700" },
  "product.created": { label: "Product added", cls: "bg-primary-container text-on-primary-container" },
  "product.updated": { label: "Product updated", cls: "bg-sky-100 text-sky-700" },
  "product.deleted": { label: "Product deleted", cls: "bg-red-100 text-red-700" },
  "user.updated": { label: "User updated", cls: "bg-sky-100 text-sky-700" },
  "user.suspended": { label: "User suspended", cls: "bg-tertiary-container text-on-tertiary-container" },
  "user.password_reset": { label: "Password reset", cls: "bg-surface-container-high text-on-surface-variant" },
  "user.deleted": { label: "User deleted", cls: "bg-red-100 text-red-700" },
  "order.refunded": { label: "Order refunded", cls: "bg-red-100 text-red-700" },
  "institution.updated": { label: "Institution updated", cls: "bg-sky-100 text-sky-700" },
  "institution.suspended": { label: "Institution suspended", cls: "bg-tertiary-container text-on-tertiary-container" },
  "institution.deleted": { label: "Institution deleted", cls: "bg-red-100 text-red-700" },
};

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

const StatCard = ({ label, value, Icon, accent, to }) => {
  const card = (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        {Icon ? <Icon size={18} className="text-on-surface-variant" aria-hidden="true" /> : null}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent || "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );

  return to ? <Link to={to}>{card}</Link> : card;
};

const Panel = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-outline-variant bg-surface p-5 ${className}`}>
    <h2 className="mb-4 text-sm font-bold text-on-surface">{title}</h2>
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
    return <div className="text-on-surface-variant">Loading dashboard...</div>;
  }

  const users = stats?.users || {};
  const activity = stats?.activity || {};

  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-on-surface-variant">
          Users, activity, sales, and a live feed of everything happening.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total users" value={users.total || 0} Icon={Users} to="/admin/registered-users" accent="text-primary" />
        <StatCard label="Schools" value={users.schools || 0} Icon={School} to="/admin/registered-users/school" />
        <StatCard label="Universities" value={users.universities || 0} Icon={GraduationCap} to="/admin/registered-users/university" />
        <StatCard label="Parents" value={users.parents || 0} Icon={Users} to="/admin/registered-users/parent" />
        <StatCard label="Students" value={users.students || 0} Icon={User} to="/admin/registered-users/student" />
        <StatCard label="Logins" value={activity.logins || 0} Icon={LogIn} />
        <StatCard label="Public registrations" value={activity.registrations || 0} Icon={UserPlus} />
        <StatCard label="Revenue (paid)" value={`R${money(stats?.orders?.revenue)}`} Icon={Banknote} accent="text-primary" to="/admin/orders" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Activity (last 14 days)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="day" fontSize={11} stroke={CHART.grid} />
                <YAxis allowDecimals={false} fontSize={11} stroke={CHART.grid} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Orders" stroke={CHART.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Registrations" stroke={CHART.sky} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Logins" stroke={CHART.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Users by type">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={usersPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
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
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="day" fontSize={11} stroke={CHART.grid} />
                <YAxis fontSize={11} stroke={CHART.grid} />
                <Tooltip formatter={(value) => `R${money(value)}`} />
                <Bar dataKey="Revenue" fill={CHART.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Orders by status">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersBar} layout="vertical">
                <XAxis type="number" allowDecimals={false} fontSize={11} stroke={CHART.grid} />
                <YAxis type="category" dataKey="status" width={110} fontSize={11} stroke={CHART.grid} />
                <Tooltip />
                <Bar dataKey="count" fill={CHART.sky} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Activity log">
          {logs.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No activity recorded yet.</p>
          ) : (
            <div className="grid gap-1">
              {logs.map((log) => {
                const meta = ACTION_LABELS[log.action] || {
                  label: log.action,
                  cls: "bg-surface-container-high text-on-surface-variant",
                };

                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center gap-3 border-b border-outline-variant py-2 text-sm last:border-b-0"
                  >
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="flex-grow text-on-surface">
                      {log.description || log.entity_ref || "—"}
                    </span>
                    <span className="text-xs text-on-surface-variant">
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
