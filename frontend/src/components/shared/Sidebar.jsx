import React from "react";
import { NavLink } from "react-router-dom";
import Button from "./Button";
import { icons } from "../../assets/icon/icons";
import useAuthStore from "../../features/auth/store/authStore";

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-6 py-3 rounded-full transition-transform font-['Lexend'] text-xs font-semibold hover:translate-x-1 ${
      isActive ? "bg-teal-600 text-white" : "text-slate-600 hover:text-teal-600"
    }`;
  return (
    <div className="w-64 p-4 min-h-screen bg-white/90 hidden md:block">
      <div className="mt-20 flex flex-col gap-4">
        <NavLink to="/products" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? icons.active_home_icon : icons.inactive_home_icon
                }
                alt="Home"
              />
              Home
            </>
          )}
        </NavLink>
        {/* <NavLink to="/sell" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? icons.active_sell_icon : icons.inactive_sell_icon
                }
                alt="Sell Items"
              />
              Sell Items
            </>
          )}
        </NavLink> */}
        <NavLink to="/cart" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? icons.active_cart_icon : icons.inactive_cart_icon
                }
                alt="Cart"
              />
              Cart
            </>
          )}
        </NavLink>
        <NavLink to="/lost-found" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? icons.active_lost_icon : icons.inactive_lost_icon
                }
                alt="Lost and Found"
              />
              Lost and Found
            </>
          )}
        </NavLink>
        <NavLink to="/thrift-store" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive ? icons.active_lost_icon : icons.inactive_lost_icon
                }
                alt="Thrift Store"
              />
              Thrift Store
            </>
          )}
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          {({ isActive }) => (
            <>
              <img
                src={
                  isActive
                    ? icons.active_settings_icon
                    : icons.inactive_settings_icon
                }
                alt="Settings"
              />
              Settings
            </>
          )}
        </NavLink>
        <button
          onClick={logout}
          className='flex items-center gap-3 px-6 py-3 rounded-full transition-transform font-["Lexend"] text-xs font-semibold text-slate-600 hover:text-teal-600 hover:translate-x-1 cursor-pointer'
        >
          <img src={icons.logout} alt="Logout" className="w-6 h-6" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
