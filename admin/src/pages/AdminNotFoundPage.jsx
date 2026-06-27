import { Link } from "react-router-dom";

const AdminNotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">Page not found</h1>
      <p className="mt-2 max-w-md text-on-surface-variant">
        That admin page doesn&apos;t exist or may have moved.
      </p>
      <Link
        to="/admin"
        className="mt-8 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:bg-on-primary-container"
      >
        Back to dashboard
      </Link>
    </div>
  );
};

export default AdminNotFoundPage;
