// Suspense fallback shown while a lazily-loaded route chunk is fetched.
const PageLoader = () => (
  <div
    className="flex min-h-[60vh] items-center justify-center"
    role="status"
    aria-label="Loading"
  >
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
  </div>
);

export default PageLoader;
