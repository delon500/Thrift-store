import { NavLink } from "react-router-dom";
import { navItems } from "./navItems";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-primary text-on-primary"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
  }`;

const Sidebar = () => {
  return (
    <aside className="hidden w-60 shrink-0 px-3 py-6 md:block">
      <nav className="sticky top-24 flex flex-col gap-1">
        <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wide text-outline">
          Browse
        </p>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
