const ConditionCard = ({ name, icon, active, onClick }) => {
  return (
    <div
      className={`flex items-center gap-2 border border-outline-variant rounded-md p-2 cursor-pointer ${active ? "bg-primary text-white" : ""}`}
      onClick={onClick}
    >
      <img src={icon} alt={name} />
      {name || "Excellent"}
    </div>
  );
};

export default ConditionCard;
