import { Link, useRouteError } from "react-router-dom";

const NotFoundPage = () => {
  // Rendered both as the 404 route and as the router errorElement, so it may
  // receive a thrown route error — log it without breaking the page.
  const error = useRouteError();
  if (error) {
    console.error("Route error:", error);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-headline-lg text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 font-headline-md text-2xl text-on-surface">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-md text-on-surface-variant">
        The page you&apos;re looking for may have been moved, or the link might
        be broken. Let&apos;s get you back to the store.
      </p>
      <Link
        to="/products"
        className="mt-8 rounded-xl bg-primary px-6 py-3 font-headline-md text-on-primary shadow-[0_6px_0_0_#00433f] transition-all active:translate-y-1 active:shadow-none"
      >
        Back to the store
      </Link>
    </div>
  );
};

export default NotFoundPage;
