import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useServerCart } from "../../cart/hooks/useCart";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { formatPrice } from "../../../lib/money";
import { submitToPayfast } from "../../orders/lib/submitToPayfast";
import {
  useCancelCheckout,
  useCreateCheckout,
  usePaymentMethods,
} from "../hooks/useCheckout";
import { useOrderStatus } from "../../orders/hooks/useOrders";

const Checkout = () => {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: cart, isLoading: cartLoading } = useServerCart();
  const { data: paymentMethods = [], isLoading: methodsLoading } =
    usePaymentMethods();
  const createCheckoutMutation = useCreateCheckout();
  const cancelCheckoutMutation = useCancelCheckout();
  const [collectionNote, setCollectionNote] = useState("");
  const cancelTriggeredRef = useRef(false);

  const items = cart?.items || [];
  const summary = cart?.summary || {};
  const paymentState = searchParams.get("payment");
  const returnedOrderReference = searchParams.get("order_reference");

  const isReturningSuccess =
    paymentState === "success" && !!returnedOrderReference;
  const { data: polledOrder } = useOrderStatus(
    returnedOrderReference,
    isReturningSuccess,
  );
  const polledStatus = polledOrder?.status;
  const paymentConfirmed =
    polledStatus === "ready_for_collection" || polledStatus === "paid";
  const paymentFailed = ["payment_failed", "cancelled", "expired"].includes(
    polledStatus,
  );

  const { mutate: cancelCheckout } = cancelCheckoutMutation;

  useEffect(() => {
    if (
      paymentState === "cancelled" &&
      returnedOrderReference &&
      !cancelTriggeredRef.current
    ) {
      cancelTriggeredRef.current = true;
      cancelCheckout(returnedOrderReference);
    }
  }, [paymentState, returnedOrderReference, cancelCheckout]);

  // If the payment confirmation (PayFast ITN) hasn't arrived after a while, stop
  // showing an endless spinner and reassure the buyer — the order still updates
  // on its own once the confirmation lands.
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  useEffect(() => {
    if (isReturningSuccess && !paymentConfirmed && !paymentFailed) {
      const timer = setTimeout(() => setConfirmTimedOut(true), 45000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isReturningSuccess, paymentConfirmed, paymentFailed]);

  const handleContinue = async () => {
    try {
      const data = await createCheckoutMutation.mutateAsync({
        // The customer chooses the actual method on PayFast; we just send a
        // valid enabled method to satisfy the API. PayFast shows all methods.
        payment_method: paymentMethods[0]?.id || "card",
        collection_note: collectionNote,
      });
      if (data?.payment_gateway?.process_url) {
        submitToPayfast(data.payment_gateway);
      } else {
        toast.error("Payment gateway unavailable. Please try again.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Checkout could not be created");
    }
  };

  if (cartLoading || methodsLoading) {
    return (
      <p className="mx-auto max-w-[1100px] text-on-surface-variant">
        Loading checkout...
      </p>
    );
  }

  if (paymentState === "success" || paymentState === "cancelled") {
    const isSuccess = paymentState === "success";
    let Icon = XCircle;
    let iconColor = "text-on-surface-variant";
    let heading = "Payment cancelled";
    let body =
      "The payment was cancelled before completion. Your reserved items have been released back to the store, so you can start a new checkout whenever you're ready.";

    if (isSuccess && paymentConfirmed) {
      Icon = CheckCircle2;
      iconColor = "text-primary";
      heading = "Payment confirmed";
      body =
        "Your order is ready for collection. Present your order reference at the school to collect your items.";
    } else if (isSuccess && paymentFailed) {
      Icon = XCircle;
      iconColor = "text-error";
      heading = "Payment not completed";
      body =
        "We couldn't confirm this payment. If money was deducted, please contact support; otherwise you can start a new checkout.";
    } else if (isSuccess && confirmTimedOut) {
      Icon = Clock;
      iconColor = "text-tertiary";
      heading = "Payment received — confirming it";
      body =
        "Your payment went through. Confirmation is taking a little longer than usual — you don't need to wait here. We'll update your order automatically, and you can track it under My orders.";
    } else if (isSuccess) {
      Icon = Loader2;
      iconColor = "text-tertiary";
      heading = "Confirming your payment…";
      body =
        "We're waiting for the payment to confirm — this usually takes a few seconds. You can also track it under My orders.";
    }

    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-outline-variant bg-surface p-8 text-center">
          <Icon
            size={48}
            className={`mx-auto ${iconColor} ${Icon === Loader2 ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-bold text-on-surface">{heading}</h1>
          <p className="mt-2 text-on-surface-variant">{body}</p>
          {paymentConfirmed && returnedOrderReference ? (
            <p className="mt-5 rounded-xl bg-surface-container-low px-4 py-3 font-semibold text-on-surface">
              Reference: {returnedOrderReference}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-full bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
            >
              View my orders
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-full border border-outline-variant px-5 py-3 font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Back to store
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
            <ShoppingBag size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Your cart is empty</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Add an item before checking out.
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
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <section>
        <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">Checkout</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          You'll choose how to pay securely on PayFast — your card and banking
          details are never stored in this app.
        </p>

        <div className="mt-6 rounded-2xl border border-outline-variant bg-surface p-6">
          <h2 className="text-lg font-bold text-on-surface">Payment</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Continue to PayFast to complete your payment with any of these
            methods:
          </p>
          {paymentMethods.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method.id}
                  className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant"
                >
                  {method.label}
                </span>
              ))}
            </div>
          ) : null}

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Collection note (optional)
            </span>
            <textarea
              value={collectionNote}
              onChange={(event) => setCollectionNote(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-sm outline-none focus:border-primary"
              placeholder="Anything the school collection desk should know..."
            />
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={createCheckoutMutation.isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {createCheckoutMutation.isPending ? (
              "Redirecting to PayFast..."
            ) : (
              <>
                Continue to PayFast
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          <p className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            Payments are processed securely by PayFast.
          </p>
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-outline-variant bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold text-on-surface">Order summary</h2>
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border-b border-outline-variant pb-3 last:border-0"
            >
              <p className="font-semibold text-on-surface">{item.name}</p>
              <p className="text-sm text-on-surface-variant">{item.schoolName}</p>
              <p className="mt-1 font-semibold text-on-surface">
                {formatPrice(item.price)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-2 text-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Service fee</span>
            <span>{formatPrice(summary.service_fee)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-outline-variant pt-3 text-lg font-bold text-on-surface">
            <span>Total</span>
            <span>{formatPrice(summary.total)}</span>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          Collect at your school with the reference number after payment.
        </p>
      </aside>
    </div>
  );
};

export default Checkout;
