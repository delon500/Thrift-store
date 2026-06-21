import { register_user_action_card } from "../../../data/data";
import CardActions from "../../../components/shared/CardActions";
import { PageHeader } from "../../../components/shared/ui";

const RegisterUsersHomePage = () => {
  return (
    <div>
      <PageHeader
        title="Register users"
        subtitle="Choose the type of account to create — each opens its own registration page."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
        {register_user_action_card.map((action, index) => {
          return (
            <CardActions
              key={index}
              name={action.name}
              description={action.description}
              color={action.color}
              Icon={action.Icon}
              to={action.to}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RegisterUsersHomePage;
