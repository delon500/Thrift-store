import CardActions from "../../../components/shared/CardActions";
import { action_card } from "../../../data/data";
import { PageHeader } from "../../../components/shared/ui";
const ItemManagementHomePage = () => {
  return (
    <div>
      <PageHeader
        title="Item management"
        subtitle="Add items, manage inventory, handle pickups, and preview the store."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
        {action_card.map((action, index) => {
          return (
            <CardActions
              key={index}
              name={action.name}
              description={action.description}
              color={action.color}
              icon={action.icons}
              to={action.to}
              comingSoon={action.comingSoon}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ItemManagementHomePage;
