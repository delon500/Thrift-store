import React from "react";
import { icons } from "../../assets/icons/icons";
const Navbar = () => {
  return (
    <header className="px-0 sm:px-[1vw] md:px-[2vw] lg:px-[3vw] w-full bg-white border-gray-300">
      <div className="flex justify-between items-center">
        {/* Left */}
        <div>Admin</div>
        {/* Right */}
        <div className="flex justify-between items-center gap-4">
          <img src={icons.notification_icon} alt="notification" />
          Israel Admin
        </div>
      </div>
    </header>
  );
};

export default Navbar;
