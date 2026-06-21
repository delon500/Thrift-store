import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useServerCart } from "../../cart/hooks/useCart";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { formatPrice } from "../../../lib/money";
import {
  useCancelCheckout,
  useCreateCheckout,
  usePaymentMethods,
} from "../hooks/useCheckout";
import { useOrderStatus } from "../../orders/hooks/useOrders";

const methodDescriptions = {
  card: "Pay securely by debit or credit card.",
  instant_eft: "Pay directly from your South African bank account.",
  capitec_pay: "Approve payment through Capitec Pay.",
  absa_pay: "Approve payment through Absa Pay.",
  snapscan: "Scan and pay with SnapScan.",
  zapper: "Scan and pay with Zapper.",
  scan_to_pay: "Use a supported scan-to-pay banking app.",
  scode: "Pay using SCode at supported retail locations.",
  mobicred: "Pay with Mobicred credit.",
};

const Checkout = () => {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: cart, isLoading: cartLoading } = useServerCart();
  const { data: paymentMethods = [], isLoading: methodsLoading } =
    usePaymentMethods();
  const createCheckoutMutation = useCreateCheckout();
  const cancelCheckoutMutation = useCancelCheckout();
  const [formData, setFormData] = useState({
    payment_method: "card",
    collection_note: "",
  });
  const [checkout, setCheckout] = useState(null);
  const cancelTriggeredRef = useRef(false);

  const items = cart?.items || [];
  const summary = cart?.summary || {};
  const paymentState = searchParams.get("payment");
  const returnedOrderReference = searchParams.get("order_reference");
  const gateway = checkout?.payment_gateway;
  const gatewayFields = gateway?.form_fields || {};

  const isReturningSuccess =
    paymentState === "success" && !!returnedOrderReference && !checkout;
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await createCheckoutMutation.mutateAsync(formData);
      setCheckout(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Checkout could not be created");
    }
  };

  if (cartLoading || methodsLoading) {
    return <p className="mx-auto max-w-[1100px] text-on-surface-variant">Loading checkout...</p>;
  }

  if ((paymentState === "success" || paymentState === "cancelled") && !checkout) {
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
          {returnedOrderReference ? (
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

  if (items.length === 0 && !checkout) {
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
          Choose how you'd like to pay. Card and banking details are handled by
          the payment provider — never stored here.
        </p>

        {checkout ? (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary-container/40 p-6">
            <h2 className="text-lg font-bold text-on-surface">
              Reference: {checkout.order_reference}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Your order is pending payment. Continue to PayFast to complete it.
            </p>

            <div className="mt-4 grid gap-2">
              {checkout.items.map((item) => (
                <div
                  key={item.reference_number}
                  className="rounded-xl bg-surface p-3 text-sm"
                >
                  <p className="font-semibold text-on-surface">
                    {item.product_name}
                  </p>
                  <p className="text-on-surface-variant">
                    {item.reference_number} · {item.institution_name}
                  </p>
                </div>
              ))}
            </div>

            {gateway ? (
              <form className="mt-5" action={gateway.process_url} method="post">
                {Object.entries(gatewayFields).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value} />
                ))}
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
                >
                  Continue to PayFast
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-xl bg-surface p-4 text-sm font-semibold text-error">
                Payment gateway details are missing. Please try checkout again.
              </p>
            )}
          </div>
        ) : (
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <section>
              <h2 className="mb-3 text-lg font-bold text-on-surface">
                Payment method
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => {
                  const selected = formData.payment_method === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`relative cursor-pointer rounded-2xl border p-4 transition-colors ${
                        selected
                          ? "border-primary bg-primary-container/30"
                          : "border-outline-variant bg-surface hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.id}
                        checked={selected}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            payment_method: event.target.value,
                          }))
                        }
                        className="sr-only"
                      />
                      {selected ? (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                          <Check size={13} aria-hidden="true" />
                        </span>
                      ) : null}
                      <span className="block font-semibold text-on-surface">
                        {method.label}
                      </span>
                      <span className="mt-1 block text-sm text-on-surface-variant">
                        {methodDescriptions[method.id]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-on-surface">
                Collection note
              </h2>
              <textarea
                value={formData.collection_note}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    collection_note: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-xl border border-outline-variant bg-surface p-3 outline-none focus:border-primary"
                placeholder="Optional note for the school collection desk..."
              />
            </section>

            <button
              type="submit"
              disabled={createCheckoutMutation.isPending}
              className="w-full rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {createCheckoutMutation.isPending
                ? "Creating checkout..."
                : "Pay & reserve items"}
            </button>
          </form>
        )}
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
              <p className="text-sm text-on-surface-variant">
                {item.schoolName} · {item.reference_number}
              </p>
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
