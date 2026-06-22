import { Trash2 } from "lucide-react";
import { formatPrice } from "../../../lib/money";

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%23f1efe8'/></svg>`,
  );

const CartItems = ({
  image,
  name,
  schoolName,
  price,
  quantity,
  listingType,
  condition,
  onClick,
  isRemoving,
}) => {
  const imageSrc = (Array.isArray(image) ? image[0] : image) || FALLBACK;

  return (
    <div className="flex gap-4 rounded-2xl border border-outline-variant bg-surface p-4">
      <img
        className="h-24 w-24 shrink-0 rounded-xl border border-outline-variant object-cover"
        alt={name}
        src={imageSrc}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = FALLBACK;
        }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-on-surface">{name}</h3>
            <p className="text-sm text-on-surface-variant">{schoolName}</p>
          </div>
          <button
            type="button"
            onClick={onClick}
            aria-label="Remove from cart"
            disabled={isRemoving}
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-on-primary-container">
            {listingType}
          </span>
          {condition ? (
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-on-surface-variant">
              {condition}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-on-surface">
            {formatPrice(price)}
          </span>
          <span className="text-sm text-on-surface-variant">Qty {quantity}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
