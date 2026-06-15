import { icons } from "../../assets/icons/icons";
import { useMe } from "../../features/auth/hook/useAuth";

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

  return (
    <header className="px-0 sm:px-[1vw] md:px-[2vw] lg:px-[3vw] w-full bg-white border-gray-300">
      <div className="flex justify-between items-center py-3">
        {/* Left */}
        <div className="font-bold text-gray-700">Admin</div>
        {/* Right */}
        <div className="flex justify-between items-center gap-4">
          <img src={icons.notification_icon} alt="notification" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {initialsOf(me?.full_name)}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-700">{name}</span>
              {me?.email ? (
                <span className="text-xs text-gray-400">{me.email}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
