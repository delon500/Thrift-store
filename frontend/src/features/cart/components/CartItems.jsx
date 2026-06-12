import { icons } from "../../../assets/icon/icons";
import { useProductStore } from "../../products/store/productStore.js";

const CartItems = ({
  image,
  name,
  schoolName,
  price,
  quantity,
  referenceNumber,
  listingType,
  condition,
  status,
  onClick,
  isRemoving,
}) => {
  const currency = useProductStore((state) => state.currency);

  const imageSrc = Array.isArray(image) ? image[0] : image;

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col sm:flex-row gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-teal-50 relative overflow-hidden">
      <img
        className="w-full h-32 sm:w-24 sm:h-24 object-cover rounded-lg border-4 border-white shadow-md rotate-[-2deg]"
        alt={name}
        src={imageSrc}
      />

      <div>
        <h3 className="font-headline-md text-xl text-primary">{name}</h3>
        <p className="text-on-surface-variant font-body-md">{schoolName}</p>
        <p className="mt-2 text-xs font-bold uppercase text-outline">
          Ref: {referenceNumber}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-primary">
            {listingType}
          </span>
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
            {condition}
          </span>
          <span className="rounded-full bg-primary-fixed px-3 py-1 text-on-primary-fixed">
            {status}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="font-headline-md text-2xl text-on-surface">
            {currency}
            {price}
          </span>
          <span className="text-sm text-on-surface-variant">
            Qty: {quantity}
          </span>
        </div>
      </div>

      <div className="absolute sm:top-4 sm:right-4 bottom-8 right-8">
        <button
          type="button"
          onClick={onClick}
          aria-label="Remove from cart"
          disabled={isRemoving}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <img
            src={icons.remove_icon}
            alt=""
            className="w-5 h-5 cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};

export default CartItems;
