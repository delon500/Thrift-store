import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CartItems from "../components/CartItems";
import { icons } from "../../../assets/icon/icons";
import { useProductStore } from "../../products/store/productStore";
import {
  useClearCart,
  useRemoveCartItem,
  useServerCart,
} from "../hooks/useCart";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const formatMoney = (amount) => Number(amount || 0).toFixed(2);

const Cart = () => {
  useDocumentTitle("Your Cart");
  const navigate = useNavigate();
  const currency = useProductStore((state) => state.currency);
  const { data: cart, isLoading, isError, error } = useServerCart();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const [collectionNote, setCollectionNote] = useState("");

  const cartItems = cart?.items || [];
  const summary = cart?.summary || {
    subtotal: 0,
    service_fee: 0,
    total: 0,
    total_items: 0,
  };

  const handleRemove = async (id) => {
    try {
      await removeCartItemMutation.mutateAsync(id);
    } catch (removeError) {
      toast.error(removeError?.response?.data?.message || "Could not remove item");
    }
  };

  const handleClear = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (clearError) {
      toast.error(clearError?.response?.data?.message || "Could not clear cart");
    }
  };

  return (
    <div className="m-6">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
        My Cart
      </h1>
      <p className="font-body-lg text-on-surface-variant">
        Review your school items before confirming collection.
      </p>

      {isError ? (
        <p className="mt-6 font-semibold text-error">
          {error?.response?.data?.message || "Could not load cart"}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col lg:flex-row gap-8 lg:items-start">
        <div className="flex-1 flex flex-col gap-4">
          {isLoading ? (
            <p className="text-on-surface-variant">Loading cart...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-on-surface-variant">Your backpack is empty.</p>
          ) : (
            cartItems.map((item) => (
              <CartItems
                key={item.id}
                image={item.image}
                name={item.name}
                schoolName={item.schoolName}
                price={item.price}
                quantity={item.quantity}
                referenceNumber={item.reference_number}
                listingType={item.listing_type}
                condition={item.condition}
                status={item.status}
                isRemoving={removeCartItemMutation.isPending}
                onClick={() => handleRemove(item.id)}
              />
            ))
          )}
        </div>

        <aside className="bg-white rounded-lg p-8 shadow-xl border-4 border-white sticker-shadow relative overflow-hidden w-full lg:max-w-md">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary-container opacity-10 rounded-full"></div>

          <h2 className="font-headline-md text-2xl mb-6 flex items-center gap-2">
            <img src={icons.order_icon} alt="Order summary" />
            Collection Summary
          </h2>

          <div className="space-y-4 font-body-md border-b-2 border-teal-100 pb-6 mb-6">
            <div className="flex justify-between text-on-surface-variant">
              <span>Items</span>
              <span>{summary.total_items}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span>
                {currency}
                {formatMoney(summary.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Service Fee</span>
              <span>
                {currency}
                {formatMoney(summary.service_fee)}
              </span>
            </div>
          </div>

          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-bold text-on-surface-variant">
              Collection note
            </span>
            <textarea
              value={collectionNote}
              onChange={(event) => setCollectionNote(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant p-3 text-sm outline-none focus:border-primary"
              placeholder="Optional note for the school..."
            />
          </label>

          <div className="flex justify-between items-center mb-8">
            <span className="font-headline-md text-xl">Total</span>
            <span className="font-headline-md text-3xl text-primary">
              {currency}
              {formatMoney(summary.total)}
            </span>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() =>
                navigate("/checkout", {
                  state: {
                    collectionNote,
                  },
                })
              }
              className="w-full bg-primary text-white font-headline-md py-4 rounded-xl shadow-[0_6px_0_0_#00433f] active:translate-y-1 active:shadow-none transition-all text-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              Checkout
            </button>
            <button
              type="button"
              disabled={cartItems.length === 0 || clearCartMutation.isPending}
              onClick={handleClear}
              className="w-full rounded-xl border border-outline-variant py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear cart
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
