import { useState } from "react";
import Input from "../ui/Input";
import { icons } from "../../assets/icon/icons";
import { NavLink, useNavigate } from "react-router-dom";
import { useProductStore } from "../../features/products/store/productStore";
import useAuthStore from "../../features/auth/store/authStore";
import { useWishlistStore } from "../../features/wishlist/store/wishlistStore";
import { useServerCart } from "../../features/cart/hooks/useCart";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import AccountMenu from "./AccountMenu";
import { navItems } from "./navItems";

const drawerLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
    isActive ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-teal-50"
  }`;

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
      {count > 9 ? "9+" : count}
    </span>
  ) : null;

const Navbar = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const navigate = useNavigate();
  const searchQuery = useProductStore((state) => state.searchQuery);
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const logout = useAuthStore((state) => state.logout);
  const wishlistCount = useWishlistStore((state) => state.wishlistItems.length);
  const { data: cart } = useServerCart();
  const cartCount = cart?.items?.length || 0;

  const closeMenu = () => setMenuToggle(false);

  return (
    <header className="w-full z-50 flex justify-between items-center px-4 md:px-8 py-1 bg-white/90  backdrop-blur-md border-teal-200 shadow-[0_4px_10px_rgba(77,182,172,0.15)] md:rounded-full mt-0 md:mt-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 md:max-w-[250px] lg:max-w-md relative hidden sm:block">
          <Input
            placeholder="Search for items..."
            type="text"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            isSearch={true}
          />
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate("/wishlist")}
            aria-label={
              wishlistCount > 0
                ? `Wishlist, ${wishlistCount} items`
                : "Wishlist"
            }
            className="relative cursor-pointer"
          >
            <img src={icons.wishlist_icon} alt="" />
            <CountBadge count={wishlistCount} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className="relative cursor-pointer"
          >
            <img src={icons.inactive_cart_icon} alt="" className="w-6 h-6" />
            <CountBadge count={cartCount} />
          </button>
          <NotificationBell />
          <AccountMenu />
          <button
            type="button"
            onClick={() => setMenuToggle(true)}
            aria-label="Open menu"
            className="cursor-pointer block md:hidden"
          >
            <img src={icons.menu_bar_icon} alt="" className="w-9" />
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {menuToggle ? (
        <div
          className="fixed inset-0 z-[998] bg-black/40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[999] w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          menuToggle ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <span className="font-black text-teal-600">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <Input
            placeholder="Search for Items..."
            type="text"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            isSearch={true}
          />
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={drawerLinkClass}
            >
              {({ isActive }) => (
                <>
                  <img
                    src={isActive ? item.activeIcon : item.icon}
                    alt=""
                    className="w-6 h-6"
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            closeMenu();
            logout();
          }}
          className="mt-2 flex w-full items-center gap-3 px-7 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <img src={icons.logout} alt="" className="w-6 h-6" />
          Logout
        </button>
      </aside>
    </header>
  );
};

export default Navbar;
