import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
    <p className="text-6xl font-black text-primary">404</p>
    <h1 className="text-2xl font-bold text-on-surface">Page not found</h1>
    <p className="text-on-surface-variant">
      That page doesn&apos;t exist or has moved.
    </p>
    <Link
      to="/school"
      className="mt-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary transition-colors hover:bg-on-primary-container"
    >
      Back to collections
    </Link>
  </div>
);

export default NotFound;
