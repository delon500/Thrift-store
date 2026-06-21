import { Link } from "react-router-dom";

const CardActions = ({ icon, color, name, description, to, comingSoon }) => {
  const baseClass =
    "bg-white p-8 rounded-lg sticker-shadow border-2 border-primary-container card-tilt flex flex-col justify-between group relative overflow-hidden gap-4";

  const content = (
    <>
      {comingSoon ? (
        <span className="absolute right-3 top-3 rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
          Coming soon
        </span>
      ) : null}
      <div className="w-fit p-4 rounded-full" style={{ backgroundColor: color }}>
        <img src={icon} alt={name} className="w-6 h-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm sm:text-xl font-bold">{name}</h2>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div className={`${baseClass} cursor-not-allowed opacity-60`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/admin/${to}`}
      className={`${baseClass} cursor-pointer transition-transform hover:scale-[1.02]`}
    >
      {content}
    </Link>
  );
};

export default CardActions;
