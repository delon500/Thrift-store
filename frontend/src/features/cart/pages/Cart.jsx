import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import CartItems from "../components/CartItems";
import {
  useClearCart,
  useRemoveCartItem,
  useServerCart,
} from "../hooks/useCart";
import { formatPrice } from "../../../lib/money";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const Cart = () => {
  useDocumentTitle("Your Cart");
  const navigate = useNavigate();
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
    if (!window.confirm("Remove all items from your cart?")) return;
    try {
      await clearCartMutation.mutateAsync();
    } catch (clearError) {
      toast.error(clearError?.response?.data?.message || "Could not clear cart");
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-on-surface-variant">
        Review your items before confirming collection.
      </p>

      {isError ? (
        <p className="mt-6 font-semibold text-error">
          {error?.response?.data?.message || "Could not load cart"}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-on-surface-variant">Loading cart...</p>
      ) : cartItems.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
            <ShoppingBag size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Your cart is empty</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Find something pre-loved to give a second life.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
          >
            Browse items
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-4">
            {cartItems.map((item) => (
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
                isRemoving={removeCartItemMutation.isPending}
                onClick={() => handleRemove(item.id)}
              />
            ))}
          </div>

          <aside className="w-full rounded-2xl border border-outline-variant bg-surface p-6 lg:sticky lg:top-24 lg:max-w-sm">
            <h2 className="text-lg font-bold text-on-surface">Collection summary</h2>

            <div className="mt-5 space-y-3 border-b border-outline-variant pb-5 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Items</span>
                <span>{summary.total_items}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Service fee</span>
                <span>{formatPrice(summary.service_fee)}</span>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-on-surface-variant">
                Collection note
              </span>
              <textarea
                value={collectionNote}
                onChange={(event) => setCollectionNote(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-sm outline-none focus:border-primary"
                placeholder="Optional note for the school..."
              />
            </label>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-bold text-on-surface">Total</span>
              <span className="text-2xl font-bold text-on-surface">
                {formatPrice(summary.total)}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => navigate("/checkout", { state: { collectionNote } })}
                className="w-full rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container"
              >
                Checkout
              </button>
              <button
                type="button"
                disabled={clearCartMutation.isPending}
                onClick={handleClear}
                className="w-full rounded-full border border-outline-variant py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-60"
              >
                Clear cart
              </button>
            </div>

            <p className="mt-5 flex items-start gap-2 text-xs text-on-surface-variant">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              Pay online, then collect at your school with the reference number.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
