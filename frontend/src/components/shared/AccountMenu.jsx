import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Package, Settings, LogOut, Users } from "lucide-react";
import useAuthStore from "../../features/auth/store/authStore";

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const AccountMenu = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
      >
        {initialsOf(user?.full_name)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[999] mt-2 w-56 overflow-hidden rounded-md border border-outline-variant bg-white shadow-lg"
        >
          <div className="border-b border-outline-variant px-4 py-3">
            <p className="truncate font-semibold text-on-surface">
              {user?.full_name || "Account"}
            </p>
            {user?.email ? (
              <p className="truncate text-xs text-on-surface-variant">
                {user.email}
              </p>
            ) : null}
          </div>
          <NavLink
            to="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low"
          >
            <Package size={18} aria-hidden="true" />
            My orders
          </NavLink>
          {user?.role === "parent" ? (
            <NavLink
              to="/family"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low"
            >
              <Users size={18} aria-hidden="true" />
              My family
            </NavLink>
          ) : null}
          <NavLink
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low"
          >
            <Settings size={18} aria-hidden="true" />
            Settings
          </NavLink>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-surface-container-low"
          >
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AccountMenu;
