import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 notebook-grid">
    <h1 className="text-4xl font-black text-teal-600">Page not found</h1>
    <Link
      to="/"
      className="rounded-full bg-teal-600 px-5 py-3 font-bold text-white"
    >
      Back to login
    </Link>
  </div>
);

export default NotFound;
