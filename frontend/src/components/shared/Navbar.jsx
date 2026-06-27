import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Package,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import { useProductStore } from "../../features/products/store/productStore";
import useAuthStore from "../../features/auth/store/authStore";
import { useWishlistStore } from "../../features/wishlist/store/wishlistStore";
import { useServerCart } from "../../features/cart/hooks/useCart";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import AccountMenu from "./AccountMenu";
import { navItems } from "./navItems";

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
      {count > 9 ? "9+" : count}
    </span>
  ) : null;

const iconButton =
  "relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchQuery = useProductStore((state) => state.searchQuery);
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);
  const wishlistCount = useWishlistStore((state) => state.wishlistItems.length);
  const { data: cart } = useServerCart();
  const cartCount = cart?.items?.length || 0;

  const closeMenu = () => setMenuOpen(false);

  const searchInput = (extraClass = "") => (
    <div className={`relative ${extraClass}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
        aria-hidden="true"
      />
      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search items..."
        aria-label="Search items"
        className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary"
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/products" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
            <ShoppingBag size={18} aria-hidden="true" />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-on-surface sm:block">
            School Thrift
          </span>
        </NavLink>

        {searchInput("mx-auto hidden w-full max-w-md sm:block")}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => navigate("/wishlist")}
            aria-label={
              wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"
            }
            className={iconButton}
          >
            <Heart size={20} aria-hidden="true" />
            <CountBadge count={wishlistCount} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className={iconButton}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <CountBadge count={cartCount} />
          </button>
          <NotificationBell />
          <AccountMenu />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={`${iconButton} md:hidden`}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[998] bg-black/40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-[999] w-72 max-w-[85vw] bg-surface shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4">
          <span className="font-extrabold text-on-surface">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className={iconButton}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">{searchInput("w-full")}</div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2 border-t border-outline-variant px-3 pt-2">
          <NavLink
            to="/orders"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
          >
            <Package size={18} aria-hidden="true" />
            My orders
          </NavLink>
          {role === "parent" ? (
            <NavLink
              to="/family"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              <Users size={18} aria-hidden="true" />
              My family
            </NavLink>
          ) : null}
          <NavLink
            to="/settings"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
          >
            <Settings size={18} aria-hidden="true" />
            Settings
          </NavLink>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-error hover:bg-error-container/40"
          >
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </header>
  );
};

export default Navbar;
