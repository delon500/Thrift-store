import crypto from "node:crypto";

const PAYFAST_URLS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

const normalizeMode = () =>
  process.env.PAYFAST_MODE === "live" ? "live" : "sandbox";

const encodePayFastValue = (value) =>
  encodeURIComponent(String(value).trim()).replace(/%20/g, "+");

const buildSignatureString = (fields, passphrase = "", { skipEmpty = true } = {}) => {
  const pairs = Object.entries(fields)
    .filter(([key, value]) => {
      if (key === "signature") return false;
      if (value === undefined || value === null) return false;
      // Outgoing payment requests omit blank fields (skipEmpty), but PayFast
      // signs every posted field — including blank ones — when it sends an ITN,
      // so signature verification must keep them.
      if (skipEmpty && String(value).trim() === "") return false;
      return true;
    })
    .map(([key, value]) => `${key}=${encodePayFastValue(value)}`);

  if (passphrase) {
    pairs.push(`passphrase=${encodePayFastValue(passphrase)}`);
  }

  return pairs.join("&");
};

const generatePayFastSignature = (fields, passphrase = "", options) =>
  crypto
    .createHash("md5")
    .update(buildSignatureString(fields, passphrase, options))
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
  // PayFast signs every posted field, including blanks, so do not skip empty
  // values when recomputing the signature for an incoming ITN.
  const expectedSignature = generatePayFastSignature(payload, config.passphrase, {
    skipEmpty: false,
  });

  return payload.signature === expectedSignature;
};

const PAYFAST_API_BASE = "https://api.payfast.co.za";

// PayFast API signature (different from the process/ITN one): md5 of ALL
// submitted variables — headers + query params + passphrase — sorted
// alphabetically as key=urlencode(value) joined by "&".
const buildApiSignature = (params) =>
  crypto
    .createHash("md5")
    .update(
      Object.keys(params)
        .sort()
        .filter((key) => key !== "signature")
        .map(
          (key) =>
            `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
        )
        .join("&"),
    )
    .digest("hex");

// Best-effort reconcile: ask PayFast (server -> PayFast, no inbound webhook
// needed) whether this m_payment_id (the order reference) shows up in the
// processed-transaction history. History lists processed payments. To avoid a
// false-confirm, we require BOTH the order reference AND the expected gross
// amount to appear, so a stray/failed/zero-amount row can't confirm an unpaid
// order. (For an even stronger guarantee, parse the history's status column once
// PayFast's exact response format is confirmed.) Any failure (no passphrase,
// network, format) returns false so the caller leaves the order pending — never
// throws, never false-confirms.
const fetchTransactionPaid = async (orderReference, createdAt, expectedAmount) => {
  try {
    const config = getPayFastConfig();
    if (!config.passphrase) return false; // the PayFast API requires a passphrase

    const day = (value) => new Date(value).toISOString().slice(0, 10);
    const query = { from: day(createdAt || Date.now()), to: day(Date.now()) };
    if (config.mode === "sandbox") query.testing = "true";

    const headers = {
      "merchant-id": config.merchantId,
      version: "v1",
      timestamp: new Date().toISOString().split(".")[0],
    };

    const signature = buildApiSignature({
      ...query,
      ...headers,
      passphrase: config.passphrase,
    });

    const url = `${PAYFAST_API_BASE}/transactions/history?${new URLSearchParams(query).toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { ...headers, signature, "content-type": "application/json" },
    });

    if (!response.ok) return false;
    const body = await response.text();

    if (!body.includes(orderReference)) return false;
    // Require the exact gross amount too — defence in depth.
    if (expectedAmount != null && expectedAmount !== "") {
      return body.includes(Number(expectedAmount).toFixed(2));
    }
    return true;
  } catch (error) {
    console.warn(`[PayFast reconcile] query failed: ${error.message}`);
    return false;
  }
};

const toMoney = (amount) => Number(amount || 0).toFixed(2);

const isMatchingAmount = (expectedAmount, receivedAmount) =>
  toMoney(expectedAmount) === toMoney(receivedAmount);

export {
  buildSignatureString,
  createPayFastPayment,
  fetchTransactionPaid,
  generatePayFastSignature,
  getPayFastConfig,
  isMatchingAmount,
  verifyPayFastSignature,
};
