import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useServerCart } from "../../cart/hooks/useCart";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { useProductStore } from "../../products/store/productStore";
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

const formatMoney = (amount) => Number(amount || 0).toFixed(2);

const Checkout = () => {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currency = useProductStore((state) => state.currency);
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

  // After returning from PayFast, poll the order until the ITN resolves it so
  // the page reflects the real outcome instead of a static "submitted" message.
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

  // When the user returns from a cancelled PayFast payment, release the held
  // items immediately instead of waiting for the checkout hold to expire.
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
    return <div className="m-6 text-on-surface-variant">Loading checkout...</div>;
  }

  if ((paymentState === "success" || paymentState === "cancelled") && !checkout) {
    const isSuccess = paymentState === "success";
    let heading = "Payment cancelled";
    let body =
      "The PayFast payment was cancelled before completion. Your reserved items have been released back to the store, so you can start a new checkout whenever you are ready.";
    let tone = "border-outline-variant";

    if (isSuccess && paymentConfirmed) {
      heading = "Payment confirmed";
      body =
        "Your payment is confirmed and your order is ready for collection. Present your order reference at the school to collect your items.";
      tone = "border-green-400";
    } else if (isSuccess && paymentFailed) {
      heading = "Payment not completed";
      body =
        "We could not confirm this payment. If money was deducted, please contact support; otherwise you can start a new checkout.";
      tone = "border-red-400";
    } else if (isSuccess) {
      heading = "Confirming your payment…";
      body =
        "We are waiting for PayFast to confirm the payment — this usually takes a few seconds. You can also track it under My orders.";
      tone = "border-amber-400";
    }

    return (
      <div className={`m-6 max-w-3xl rounded-lg border-2 ${tone} bg-white p-6`}>
        <p className="text-sm font-bold uppercase text-primary">
          PayFast sandbox
        </p>
        <h1 className="mt-2 text-3xl font-bold text-on-surface">{heading}</h1>
        <p className="mt-3 text-on-surface-variant">{body}</p>
        {returnedOrderReference ? (
          <p className="mt-4 rounded-lg bg-surface-container-low p-4 font-bold text-primary">
            Order reference: {returnedOrderReference}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="rounded-full bg-primary px-5 py-3 font-bold text-on-primary"
          >
            View my orders
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-full border border-outline-variant px-5 py-3 font-bold text-on-surface"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !checkout) {
    return (
      <div className="m-6">
        <h1 className="text-3xl font-bold text-on-surface">Checkout</h1>
        <p className="mt-3 text-on-surface-variant">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mt-6 rounded-full bg-primary px-5 py-3 font-bold text-on-primary"
        >
          Browse products
        </button>
      </div>
    );
  }

  return (
    <div className="m-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section>
        <p className="text-sm font-bold uppercase text-primary">Secure payment</p>
        <h1 className="mt-2 text-4xl font-bold text-on-surface">Checkout</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Choose a South African payment method. Banking and card credentials
          are handled by the payment provider, not stored in this app.
        </p>

        {checkout ? (
          <div className="mt-8 rounded-lg border border-primary-fixed-dim bg-primary-fixed p-6 text-on-primary-fixed">
            <p className="text-sm font-bold uppercase">PayFast sandbox</p>
            <h2 className="mt-2 text-2xl font-bold">
              Order reference: {checkout.order_reference}
            </h2>
            <p className="mt-2 text-sm">
              Your order is pending payment. Continue to PayFast to complete
              the card, Instant EFT, wallet, or supported banking payment in
              sandbox mode.
            </p>

            <div className="mt-5 grid gap-3">
              {checkout.items.map((item) => (
                <div
                  key={item.reference_number}
                  className="rounded-lg bg-white/70 p-4 text-sm"
                >
                  <p className="font-bold">{item.product_name}</p>
                  <p>Item reference: {item.reference_number}</p>
                  <p>{item.institution_name}</p>
                </div>
              ))}
            </div>

            {gateway ? (
              <form
                className="mt-6"
                action={gateway.process_url}
                method="post"
              >
                {Object.entries(gatewayFields).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value} />
                ))}
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-3 font-bold text-on-primary"
                >
                  Continue to PayFast Sandbox
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-lg bg-white/70 p-4 text-sm font-bold text-error">
                Payment gateway details are missing. Please try checkout again.
              </p>
            )}
          </div>
        ) : (
          <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-outline-variant bg-white p-5">
              <h2 className="text-xl font-bold text-on-surface">
                Payment method
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.payment_method === method.id
                        ? "border-primary bg-surface-container-low"
                        : "border-outline-variant bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={formData.payment_method === method.id}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          payment_method: event.target.value,
                        }))
                      }
                      className="sr-only"
                    />
                    <span className="font-bold text-on-surface">
                      {method.label}
                    </span>
                    <span className="mt-2 block text-sm text-on-surface-variant">
                      {methodDescriptions[method.id]}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5">
              <h2 className="text-xl font-bold text-on-surface">
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
                rows={4}
                className="mt-4 w-full rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
                placeholder="Optional note for the school collection desk..."
              />
            </section>

            <button
              type="submit"
              disabled={createCheckoutMutation.isPending}
              className="rounded-xl bg-primary px-6 py-4 text-lg font-bold text-on-primary shadow-[0_6px_0_0_#00433f] disabled:opacity-60"
            >
              {createCheckoutMutation.isPending
                ? "Creating checkout..."
                : "Pay and Reserve Items"}
            </button>
          </form>
        )}
      </section>

      <aside className="h-fit rounded-lg border-4 border-white bg-white p-6 shadow-xl sticker-shadow">
        <h2 className="text-2xl font-bold text-on-surface">Order summary</h2>
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="border-b border-outline-variant pb-4">
              <p className="font-bold text-primary">{item.name}</p>
              <p className="text-sm text-on-surface-variant">
                Ref: {item.reference_number}
              </p>
              <p className="text-sm text-on-surface-variant">
                {item.schoolName}
              </p>
              <p className="mt-2 font-bold">
                {currency}
                {item.price}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {currency}
              {formatMoney(summary.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Service fee</span>
            <span>
              {currency}
              {formatMoney(summary.service_fee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-outline-variant pt-4 text-xl font-bold text-primary">
            <span>Total</span>
            <span>
              {currency}
              {formatMoney(summary.total)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Checkout;
