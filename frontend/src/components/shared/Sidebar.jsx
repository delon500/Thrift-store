import { NavLink } from "react-router-dom";
import { icons } from "../../assets/icon/icons";
import useAuthStore from "../../features/auth/store/authStore";
import { navItems } from "./navItems";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-6 py-3 rounded-full transition-transform font-['Lexend'] text-xs font-semibold hover:translate-x-1 ${
    isActive ? "bg-teal-600 text-white" : "text-slate-600 hover:text-teal-600"
  }`;

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-64 p-4 min-h-screen bg-white/90 hidden md:block">
      <div className="mt-20 flex flex-col gap-4">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
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
        <button
          onClick={logout}
          className='flex items-center gap-3 px-6 py-3 rounded-full transition-transform font-["Lexend"] text-xs font-semibold text-slate-600 hover:text-teal-600 hover:translate-x-1 cursor-pointer'
        >
          <img src={icons.logout} alt="" className="w-6 h-6" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
