const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-sm text-on-surface-variant">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
