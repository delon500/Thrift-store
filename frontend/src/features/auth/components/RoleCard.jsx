const RoleCard = ({ active, onClick, label, desc, icon: Icon }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-primary bg-primary-container/40"
          : "border-outline-variant bg-surface hover:border-primary/50"
      }`}
    >
      {Icon ? (
        <Icon
          size={18}
          className={active ? "text-primary" : "text-on-surface-variant"}
          aria-hidden="true"
        />
      ) : null}
      <span className="min-w-0">
        <span className="block font-semibold text-on-surface">{label}</span>
        <span className="block text-xs text-on-surface-variant">{desc}</span>
      </span>
    </button>
  );
};

export default RoleCard;
