import CardActions from "../../../components/shared/CardActions";
import { registered_user_action_card } from "../../../data/data";

const RegisteredUsersHomePage = () => {
  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-sm sm:text-2xl font-black text-teal-600">
          Registered Users
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Browse everyone registered on the platform, grouped by type.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
        {registered_user_action_card.map((action, index) => (
          <CardActions
            key={index}
            name={action.name}
            description={action.description}
            color={action.color}
            icon={action.icons}
            to={action.to}
          />
        ))}
      </div>
    </div>
  );
};

export default RegisteredUsersHomePage;
