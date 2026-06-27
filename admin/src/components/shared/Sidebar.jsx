import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Package,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  ChevronDown,
  Shield,
  School,
  GraduationCap,
  User,
  ClipboardList,
  PackagePlus,
  Boxes,
  PackageCheck,
  Store,
  ShoppingBag,
  QrCode,
} from "lucide-react";
import useAuthStore from "../../features/auth/store/authStore";
import { useMe } from "../../features/auth/hook/useAuth";

const GROUPS = [
  {
    label: "Register users",
    Icon: UserPlus,
    superOnly: true,
    items: [
      {
        to: "/admin/register-users/staff",
        label: "Register admin",
        Icon: Shield,
      },
      {
        to: "/admin/register-users/school",
        label: "Register school",
        Icon: School,
      },
      {
        to: "/admin/register-users/parent",
        label: "Register parents",
        Icon: Users,
      },
      {
        to: "/admin/register-users/university",
        label: "Register university",
        Icon: GraduationCap,
      },
      {
        to: "/admin/register-users/student",
        label: "Register students",
        Icon: User,
      },
    ],
  },
  {
    label: "Registered users",
    Icon: Users,
    items: [
      {
        to: "/admin/registrations",
        label: "Registration requests",
        Icon: ClipboardList,
      },
      { to: "/admin/registered-users/school", label: "Schools", Icon: School },
      {
        to: "/admin/registered-users/university",
        label: "Universities",
        Icon: GraduationCap,
      },
      {
        to: "/admin/registered-users/admin",
        label: "Admins",
        Icon: Shield,
      },
      { to: "/admin/registered-users/student", label: "Students", Icon: User },
      { to: "/admin/registered-users/parent", label: "Parents", Icon: Users },
    ],
  },
  {
    label: "Item management",
    Icon: Package,
    items: [
      {
        to: "/admin/lost-and-found-management/add-items",
        label: "Add items",
        Icon: PackagePlus,
      },
      { to: "/admin/inventory", label: "Manage inventory", Icon: Boxes },
      {
        to: "/admin/orders",
        label: "Pickup & collections",
        Icon: PackageCheck,
      },
      { to: "/admin/view-store", label: "View store", Icon: Store },
    ],
  },
];

const BOTTOM_LINKS = [
  { to: "/admin/institutions", label: "Institutions", Icon: Building2 },
  { to: "/admin/tags", label: "QR tags", Icon: QrCode, superOnly: true },
  { to: "/admin/payments", label: "Payments", Icon: CreditCard },
  { to: "/admin/reports", label: "Reports", Icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", Icon: Settings, superOnly: true },
  { to: "/admin/account", label: "Account", Icon: UserCircle },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-on-primary"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
  }`;

const isPathActive = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

const SidebarGroup = ({ group, onNavigate }) => {
  const { pathname } = useLocation();
  const active = group.items.some((item) => isPathActive(pathname, item.to));
  const [isOpen, setIsOpen] = useState(active);
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setIsOpen(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          active
            ? "text-on-surface"
            : "text-on-surface-variant hover:bg-surface-container-low"
        }`}
      >
        <group.Icon size={18} aria-hidden="true" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen ? (
        <div className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-outline-variant pl-2">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={linkClass}
            >
              <item.Icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const SidebarNav = ({ onNavigate }) => {
  const logout = useAuthStore((state) => state.logout);
  const { data: me } = useMe();
  const isSuper = me?.role === "super_admin";
  const roleName =
    me?.role === "super_admin"
      ? "Super Admin"
      : me?.role === "admin"
        ? "Admin"
        : me?.role === "staff"
          ? "Staff"
          : "User";
  const groups = GROUPS.filter((group) => !group.superOnly || isSuper);
  const bottom = BOTTOM_LINKS.filter((link) => !link.superOnly || isSuper);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
          <ShoppingBag size={18} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-on-surface">
            School Thrift
          </p>
          <p className="text-xs text-on-surface-variant">{roleName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        <NavLink to="/admin" end onClick={onNavigate} className={linkClass}>
          <LayoutDashboard size={18} aria-hidden="true" />
          Dashboard
        </NavLink>

        {groups.map((group) => (
          <SidebarGroup
            key={group.label}
            group={group}
            onNavigate={onNavigate}
          />
        ))}

        <div className="my-2 border-t border-outline-variant" />

        {bottom.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={linkClass}
          >
            <link.Icon size={18} aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-outline-variant p-2">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-error transition-colors hover:bg-error-container/40"
        >
          <LogOut size={18} aria-hidden="true" />
          Logout
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
