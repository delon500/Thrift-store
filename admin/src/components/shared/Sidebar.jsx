import { NavLink } from "react-router-dom";
import useAuthStore from "../../features/auth/store/authStore";
import { icons } from "../../assets/icons/icons";

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  return (
    <div className="w-[15%] min-h-screen border-gray-300  border-r-2 bg-white">
      <div className="flex flex-col gap-4 pt-6 pl-[3%] text-[15px]">
        <span>MAIN</span>
      </div>

      <NavLink to={"/admin"} className="flex items-center gap-3 px-3 py-2">
        <img src={icons.admin_home_icon} alt="" className="w-5 h-5" />
        <p className="hidden md:block text-gray-500">Dashboard</p>
      </NavLink>
      <NavLink
        to={"/admin/register-users"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img src={icons.admin_register_users_icon} alt="" className="w-5 h-5" />
        <p className="hidden md:block text-gray-500">Register Users</p>
      </NavLink>
      <NavLink
        to={"/admin/registrations"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img
          src={icons.admin_register_users_icon}
          alt=""
          className="w-5 h-5"
        />
        <p className="hidden md:block text-gray-500">Registration Requests</p>
      </NavLink>
      <NavLink
        to={"/admin/lost-and-found-management"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img
          src={icons.admin_item_management_icon}
          alt=""
          className="w-5 h-5"
        />
        <p className="hidden md:block text-gray-500">Item Management Center</p>
      </NavLink>
      <NavLink
        to={"/admin/inventory"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img
          src={icons.admin_item_management_icon}
          alt=""
          className="w-5 h-5"
        />
        <p className="hidden md:block text-gray-500">Inventory</p>
      </NavLink>
      <NavLink
        to={"/admin/orders"}
        className="flex items-center gap-3 px-3 py-2"
      >
        <img
          src={icons.payment_verification}
          alt=""
          className="w-5 h-5"
        />
        <p className="hidden md:block text-gray-500">Orders & Collections</p>
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
