// Shared UI primitives + class constants so pages share one look.
// Colors come from the marketplace theme tokens (see index.css).

export const inputClass =
  "rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary";

export const cardClass = "rounded-2xl border border-outline-variant bg-surface";

export const tableWrapClass =
  "overflow-hidden rounded-2xl border border-outline-variant bg-surface";

export const theadClass =
  "bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant";

export const thClass = "px-4 py-3 text-left font-semibold";

export const rowClass =
  "border-t border-outline-variant hover:bg-surface-container-low";

export const tdClass = "px-4 py-3 text-on-surface";

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
    {children ? <div className="flex items-center gap-2">{children}</div> : null}
  </div>
);

const TONES = {
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
  info: "bg-sky-100 text-sky-700",
};

export const Badge = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
      TONES[tone] || TONES.neutral
    } ${className}`}
  >
    {children}
  </span>
);

export const SummaryCard = ({ label, value, accent, Icon }) => (
  <div className={`${cardClass} flex items-center justify-between p-4`}>
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent || "text-on-surface"}`}>
        {value}
      </p>
    </div>
    {Icon ? (
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
        <Icon size={20} aria-hidden="true" />
      </span>
    ) : null}
  </div>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold text-on-surface">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-2xl leading-none text-on-surface-variant hover:text-on-surface"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);
