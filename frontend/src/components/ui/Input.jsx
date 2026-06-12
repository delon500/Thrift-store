import React from "react";
import { icons } from "../../assets/icon/icons.js";

const Input = ({
  placeholder,
  value,
  onChange,
  type = "text",
  hidden = false,
  isSearch = false,
  name = "",
}) => {
  return (
    <>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className="w-full rounded-full border-2 px-4 py-3 text-sm outline-none transition-all bg-white text-on-surface placeholder:text-slate-400 border-surface-container-high focus:border-primary focus:shadow-[0_0_0_4px_rgba(0,106,99,0.08)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 "
      />
      {isSearch && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <img src={icons.search_icon} alt="" />
        </span>
      )}
    </>
  );
};

export default Input;
