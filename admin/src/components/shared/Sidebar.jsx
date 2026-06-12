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

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Sidebar;
