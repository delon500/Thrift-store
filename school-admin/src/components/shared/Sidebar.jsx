import { NavLink } from "react-router-dom";
import {
  ShoppingBag,
  LayoutDashboard,
  PackageCheck,
  ClipboardList,
  History,
  Boxes,
  LogOut,
} from "lucide-react";
import useAuthStore from "../../features/auth/store/authStore";

// Nav items grow as each step lands (Account…).
const NAV = [
  { to: "/school", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/school/collections", label: "Collections", Icon: PackageCheck },
  { to: "/school/orders", label: "Orders", Icon: ClipboardList },
  { to: "/school/history", label: "History", Icon: History },
  { to: "/school/inventory", label: "Inventory", Icon: Boxes },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-primary-container text-on-primary-container"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
  }`;

// Shared nav body — reused by the desktop sidebar and the mobile drawer.
export const SidebarNav = ({ onNavigate }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const institution = user?.institution_name || user?.full_name || "School staff";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
          <ShoppingBag size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-tight text-on-surface">
            School Thrift
          </p>
          <p className="truncate text-xs text-on-surface-variant">{institution}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-container/40"
        >
          <LogOut size={18} aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );
};

const Sidebar = () => (
  <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-outline-variant bg-surface md:block">
    <SidebarNav />
  </aside>
);

export default Sidebar;
