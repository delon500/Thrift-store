import React from "react";

const AdminHome = () => {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-sm sm:text-2xl font-black text-teal-600">
          Dashboard
        </h1>
        <p className="text-sm sm:text-sm font-medium text-gray-500">
          Manage the school store inventory, verify pickups, and set up your
          shopfront.
        </p>
      </div>
    </div>
  );
};

export default AdminHome;
