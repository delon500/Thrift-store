import CardActions from "../../../components/shared/CardActions";
import { registered_user_action_card } from "../../../data/data";
import { PageHeader } from "../../../components/shared/ui";

const RegisteredUsersHomePage = () => {
  return (
    <div>
      <PageHeader
        title="Registered users"
        subtitle="Browse everyone registered on the platform, grouped by type."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
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
