import { Link } from "react-router-dom";

export default function Button({ children, to, onClick, type = "button" }) {
  const className =
    "w-full bg-primary text-on-primary py-3 px-5 rounded-xl font-label-caps text-xs sm:text-sm chunky-button flex items-center justify-center gap-3 cursor-pointer hover:bg-primary/90 active:bg-primary/80 transition-colors mt-auto";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
