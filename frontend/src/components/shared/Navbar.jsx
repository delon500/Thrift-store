import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "./Button";
import { icons } from "../../assets/icon/icons";
import { Link, useNavigate } from "react-router-dom";
import BreadCrumbs from "./BreadCrumbs";
import { useProductStore } from "../../features/products/store/productStore";
import useAuthStore from "../../features/auth/store/authStore";
import NotificationBell from "../../features/notifications/components/NotificationBell";
const Navbar = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const navigate = useNavigate();
  const searchQuery = useProductStore((state) => state.searchQuery);
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const token = useAuthStore((state) => state.token);
  return (
    <header className="w-full z-50 flex justify-between items-center px-4 md:px-8 py-1 bg-white/90  backdrop-blur-md border-teal-200 shadow-[0_4px_10px_rgba(77,182,172,0.15)] md:rounded-full mt-0 md:mt-2">
      <div className="flex items-center justify-between w-full">
        {/* <BreadCrumbs /> */}
        <div className="flex-1 md:max-w-[250px] lg:max-w-md relative hidden sm:block">
          <Input
            placeholder="Search for 'Backpack'..."
            type="text"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            isSearch={true}
          />
        </div>
        <div className="flex items-center gap-6">
          <img
            src={icons.wishlist_icon}
            alt="whichlist"
            className="cursor-pointer"
            onClick={() => navigate("/wishlist")}
          />
          {token ? <NotificationBell /> : null}
          {token ? (
            <div className="relative group">
              <img
                src={icons.profile_icon}
                alt="Profile"
                className="cursor-pointer w-8 h-8"
              />
            </div>
          ) : (
            <Button to="/auth">Login</Button>
          )}
          <img
            src={icons.menu_bar_icon}
            alt="Menu"
            className="cursor-pointer block sm:hidden w-9"
            onClick={() => setMenuToggle(true)}
          />
        </div>
      </div>

      <>
        {
          <div
            className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all duration-300 ease-in-out ${menuToggle ? "w-full" : "w-0"} min-h-screen z-999 flex flex-col items-center justify-center gap-8`}
          >
            <div></div>
          </div>
        }
      </>
    </header>
  );
};

export default Navbar;
