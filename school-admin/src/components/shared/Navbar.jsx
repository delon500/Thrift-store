import { useState } from "react";
import { Menu, X } from "lucide-react";
import useAuthStore from "../../features/auth/store/authStore";
import { SidebarNav } from "./Sidebar";

const initials = (name) =>
  (name || "S")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const label = user?.institution_name || user?.full_name || "School staff";

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low md:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <p className="font-bold text-on-surface">School Thrift</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-on-surface">{label}</p>
            <p className="text-xs text-on-surface-variant">School staff</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
            {initials(user?.full_name || user?.institution_name)}
          </span>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-outline-variant bg-surface">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
