// Lightweight shimmer placeholders shown while data loads, so pages reserve
// layout instead of flashing blank. Built on Tailwind's animate-pulse.

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />
);

// Mirrors the ProductCard layout so the grid doesn't jump when data arrives.
export const ProductCardSkeleton = () => (
  <div className="flex h-full w-full max-w-[300px] flex-col bg-white/90">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="flex flex-col gap-3 p-3">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-3/4" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="mt-1 h-10 w-full rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
