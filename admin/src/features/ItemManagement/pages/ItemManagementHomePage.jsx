import React from "react";
import CardActions from "../../../components/shared/CardActions";
import { action_card } from "../../../data/data";
const ItemManagementHomePage = () => {
  return (
    <div className="mt-3">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-sm sm:text-2xl font-black text-teal-600">Item Management Center</h1>
        <p className="text-sm sm:text-sm font-medium text-gray-500">
          Manage the school store inventory, verify pickups, and set up your
          shopfront.
        </p>
      </div>

      {/* Card Actions */}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
        {action_card.map((action, index) => {
          return (
            <CardActions
              key={index}
              name={action.name}
              description={action.description}
              color={action.color}
              icon={action.icons}
              to={action.to}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ItemManagementHomePage;
