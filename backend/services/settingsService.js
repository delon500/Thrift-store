import pool from "../config/db.js";

// Catalog of payment methods the gateway (PayFast) supports. Admins choose which
// of these to OFFER customers (the enabled subset, stored in settings); the
// catalog itself is provider-defined and lives in code.
export const PAYMENT_METHOD_CATALOG = [
  { id: "card", label: "Card", provider: "payfast", type: "gateway" },
  { id: "instant_eft", label: "Instant EFT", provider: "payfast", type: "bank" },
  { id: "capitec_pay", label: "Capitec Pay", provider: "payfast", type: "bank" },
  { id: "absa_pay", label: "Absa Pay", provider: "payfast", type: "bank" },
  { id: "snapscan", label: "SnapScan", provider: "payfast", type: "qr" },
  { id: "zapper", label: "Zapper", provider: "payfast", type: "qr" },
  { id: "scan_to_pay", label: "Scan to Pay", provider: "payfast", type: "qr" },
  { id: "scode", label: "SCode", provider: "payfast", type: "retail" },
  { id: "mobicred", label: "Mobicred", provider: "payfast", type: "credit" },
];

// Hardcoded fallbacks. A missing or unreadable stored setting always falls back
// here, so the settings layer can never break the cart or checkout.
export const SETTINGS_DEFAULTS = {
  service_fee: 1.5,
  checkout_expiry_minutes: 30,
  enabled_payment_methods: PAYMENT_METHOD_CATALOG.map((method) => method.id),
};

const SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS);

// Settings change rarely but are read on every cart calc / checkout, so a small
// in-memory cache avoids a DB hit per request. Writes call invalidate below.
let cache = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60000;

export const getSettings = async () => {
  if (cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;

  const merged = { ...SETTINGS_DEFAULTS };
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM app_settings WHERE key = ANY($1)",
      [SETTING_KEYS],
    );
    for (const row of rows) {
      if (row.key in merged && row.value !== null) merged[row.key] = row.value;
    }
  } catch (error) {
    console.error(`[settings] read failed, using defaults: ${error.message}`);
  }

  cache = merged;
  cachedAt = Date.now();
  return cache;
};

export const invalidateSettingsCache = () => {
  cache = null;
  cachedAt = 0;
};

export const getServiceFee = async () =>
  Number((await getSettings()).service_fee);

export const getCheckoutExpiryMinutes = async () =>
  Number((await getSettings()).checkout_expiry_minutes);

// The catalog entries that are currently enabled, in catalog order.
export const getEnabledPaymentMethods = async () => {
  const enabled = (await getSettings()).enabled_payment_methods || [];
  return PAYMENT_METHOD_CATALOG.filter((method) => enabled.includes(method.id));
};
