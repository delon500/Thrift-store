import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuthStore from "../../features/auth/store/authStore";
import { useMe } from "../../features/auth/hook/useAuth";
import { icons } from "../../assets/icons/icons";
import {
  action_card,
  registered_user_action_card,
  register_user_action_card,
} from "../../data/data";

const toAdminPath = (path) =>
  path.startsWith("/") ? `/admin${path}` : `/admin/${path}`;

const isPathActive = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

const sidebarGroups = [
  {
    label: "Register Users",
    to: "/admin/register-users",
    icon: icons.admin_register_users_icon,
    items: register_user_action_card,
  },
  {
    label: "Registered Users",
    to: "/admin/registered-users",
    icon: icons.admin_register_users_icon,
    items: registered_user_action_card,
  },
  {
    label: "Item Management Center",
    to: "/admin/lost-and-found-management",
    icon: icons.admin_item_management_icon,
    items: action_card,
  },
];

const SidebarGroup = ({ group }) => {
  const { pathname } = useLocation();
  const childPaths = group.items.map((item) => toAdminPath(item.to));
  const active =
    isPathActive(pathname, group.to) ||
    childPaths.some((path) => isPathActive(pathname, path));
  const [isOpen, setIsOpen] = useState(active);
  const [wasActive, setWasActive] = useState(active);

  // Auto-expand a group when navigation makes it active (render-time pattern,
  // no effect / cascading renders).
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setIsOpen(true);
  }

  return (
    <div>
      <div className="flex items-center">
        <NavLink
          to={group.to}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
          onClick={() => setIsOpen(true)}
        >
          <img src={group.icon} alt="" className="h-5 w-5 shrink-0" />
          <p className="hidden truncate text-gray-500 md:block">{group.label}</p>
        </NavLink>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="hidden px-2 py-2 text-gray-500 md:block"
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.label}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen ? (
        <div className="ml-6 border-l border-gray-200 py-1">
          {group.items.map((item) => (
            <NavLink
              key={item.name}
              to={toAdminPath(item.to)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-teal-700"
                    : "text-gray-500 hover:text-teal-700"
                }`
              }
            >
              <img src={item.icons} alt="" className="h-4 w-4 shrink-0" />
              <span className="hidden truncate md:block">{item.name}</span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  const { data: me } = useMe();
  const isSuper = me?.role === "super_admin";
  // Creating accounts (Register Users) is super-admin only.
  const groups = sidebarGroups.filter(
    (group) => group.label !== "Register Users" || isSuper,
  );
  return (
    <div className="w-[15%] min-h-screen border-gray-300  border-r-2 bg-white">
      <div className="flex flex-col gap-4 pt-6 pl-[3%] text-[15px]">
        <span>MAIN</span>
      </div>

      <NavLink to={"/admin"} className="flex items-center gap-3 px-3 py-2">
        <img src={icons.admin_home_icon} alt="" className="w-5 h-5" />
        <p className="hidden md:block text-gray-500">Dashboard</p>
      </NavLink>
      {groups.map((group) => (
        <SidebarGroup key={group.label} group={group} />
      ))}
      <NavLink
        to={"/admin/institutions"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img src={icons.admin_school_icon} alt="" className="w-5 h-5" />
        <p className="hidden md:block text-gray-500">Institutions</p>
      </NavLink>
      <NavLink
        to={"/admin/payments"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p className="hidden md:block text-gray-500">Payments</p>
      </NavLink>
      <NavLink
        to={"/admin/reports"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-6m3 6V7m3 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <p className="hidden md:block text-gray-500">Reports</p>
      </NavLink>
      {isSuper ? (
        <NavLink
          to={"/admin/settings"}
          className="flex items-center gap-3 px-3 py-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="hidden md:block text-gray-500">Settings</p>
        </NavLink>
      ) : null}
      <NavLink
        to={"/admin/account"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <p className="hidden md:block text-gray-500">Account</p>
      </NavLink>

      <button
        onClick={logout}
        className="mt-8 flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span className="hidden md:block">Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
