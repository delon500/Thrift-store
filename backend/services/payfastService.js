import crypto from "node:crypto";

const PAYFAST_URLS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

const normalizeMode = () =>
  process.env.PAYFAST_MODE === "live" ? "live" : "sandbox";

const encodePayFastValue = (value) =>
  encodeURIComponent(String(value).trim()).replace(/%20/g, "+");

const buildSignatureString = (fields, passphrase = "") => {
  const pairs = Object.entries(fields)
    .filter(
      ([key, value]) =>
        key !== "signature" &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== "",
    )
    .map(([key, value]) => `${key}=${encodePayFastValue(value)}`);

  if (passphrase) {
    pairs.push(`passphrase=${encodePayFastValue(passphrase)}`);
  }

  return pairs.join("&");
};

const generatePayFastSignature = (fields, passphrase = "") =>
  crypto
    .createHash("md5")
    .update(buildSignatureString(fields, passphrase))
    .digest("hex");

const getPayFastConfig = () => {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

  if (!merchantId || !merchantKey) {
    throw new Error(
      "PayFast is not configured. Add PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY to backend/.env.",
    );
  }

  const mode = normalizeMode();

  return {
    mode,
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    processUrl: PAYFAST_URLS[mode],
  };
};

const getBaseUrl = (req) => {
  if (process.env.API_PUBLIC_URL) return process.env.API_PUBLIC_URL;

  return `${req.protocol}://${req.get("host")}`;
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5174";

const createPayFastPayment = ({ order, user, summary, method, req }) => {
  const config = getPayFastConfig();
  const apiBaseUrl = getBaseUrl(req);
  const frontendUrl = getFrontendUrl();
  const amount = Number(summary.total).toFixed(2);
  const nameParts = String(user.full_name || "Customer").trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ");

  const fields = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${frontendUrl}/checkout?payment=success&order_reference=${order.order_reference}`,
    cancel_url: `${frontendUrl}/checkout?payment=cancelled&order_reference=${order.order_reference}`,
    notify_url:
      process.env.PAYFAST_NOTIFY_URL ||
      `${apiBaseUrl}/api/payments/payfast/itn`,
    name_first: firstName,
    name_last: lastName,
    email_address: user.email,
    m_payment_id: order.order_reference,
    amount,
    item_name: `School collection ${order.order_reference}`,
    item_description:
      "School thrift and lost-and-found collection order payment.",
    custom_str1: method.id,
  };

  return {
    provider: "payfast",
    mode: config.mode,
    process_url: config.processUrl,
    form_fields: {
      ...fields,
      signature: generatePayFastSignature(fields, config.passphrase),
    },
  };
};

const verifyPayFastSignature = (payload) => {
  const config = getPayFastConfig();
  const expectedSignature = generatePayFastSignature(payload, config.passphrase);

  return payload.signature === expectedSignature;
};

const toMoney = (amount) => Number(amount || 0).toFixed(2);

const isMatchingAmount = (expectedAmount, receivedAmount) =>
  toMoney(expectedAmount) === toMoney(receivedAmount);

export {
  buildSignatureString,
  createPayFastPayment,
  generatePayFastSignature,
  getPayFastConfig,
  isMatchingAmount,
  verifyPayFastSignature,
};
