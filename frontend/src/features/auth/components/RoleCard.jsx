import React from "react";

const RoleCard = ({ active, onClick, label, desc }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${
        active
          ? "border-primary bg-primary-container/40 shadow-md"
          : "border-surface-container-high bg-white hover:border-primary/40"
      }`}
    >
      <div className="font-semibold text-on-surface">{label}</div>
      <div className="text-sm text-on-surface-variant mt-1">{desc}</div>
    </button>
  );
};

export default RoleCard;
