import React from "react";
import { register_user_action_card } from "../../../data/data";
import CardActions from "../../../components/shared/CardActions";

const RegisterUsersHomePage = () => {
  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-sm sm:text-2xl font-black text-teal-600">
          Register Users
        </h1>
        <p className="text-sm sm:text-sm font-medium text-gray-500">
          Select the type of profile you want to create. Each option below opens
          its own dedicated registration page, keeping the process simple.
          focused. and easier to manage.
        </p>
      </div>

      {/* Card Actions */}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
        {register_user_action_card.map((action, index) => {
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

export default RegisterUsersHomePage;
