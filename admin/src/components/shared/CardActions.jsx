import React from "react";
import { Link } from "react-router-dom";

const CardActions = ({ icon, color, name, description, to }) => {
  return (
    <Link
      to={`/admin/${to}`}
      className=" bg-white p-8 rounded-lg sticker-shadow border-2 border-primary-container card-tilt flex flex-col justify-between group hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden gap-4"
    >
      <div
        className={` w-fit p-4 rounded-full`}
        style={{ backgroundColor: color }}
      >
        <img src={icon} alt={name} className="w-6 h-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm sm:text-xl font-bold">{name}</h2>
        <p className="text-xs text-gray-00">{description}</p>
      </div>
    </Link>
  );
};

export default CardActions;
