import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useMe } from "../../features/auth/hook/useAuth";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import { SidebarNav } from "./Sidebar";

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "A";

const Navbar = () => {
  const { data: me } = useMe();
  const name = me?.full_name || "Admin";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low md:hidden"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
              {initialsOf(me?.full_name)}
            </div>
            <div className="hidden leading-tight sm:flex sm:flex-col">
              <span className="text-sm font-semibold text-on-surface">{name}</span>
              {me?.email ? (
                <span className="text-xs text-on-surface-variant">{me.email}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[998] bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-[999] w-64 max-w-[85vw] bg-surface shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          className="absolute right-2 top-3 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
      </aside>
    </header>
  );
};

export default Navbar;
