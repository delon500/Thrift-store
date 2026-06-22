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

export const SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS);

// Settings change rarely but are read on every cart calc / checkout, so a small
// in-memory cache avoids a DB hit per request. Writes call invalidate below.
// Effective value resolves: institution override -> global app_settings -> default.
let cache = null;
let cachedAt = 0;
const instCache = new Map(); // institutionId -> { value, at }
const CACHE_TTL_MS = 60000;

const readGlobalSettings = async () => {
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
  return merged;
};

const getGlobalSettings = async () => {
  if (cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;
  cache = await readGlobalSettings();
  cachedAt = Date.now();
  return cache;
};

// The raw override rows for one institution as { key: value } (only keys it sets).
export const getInstitutionOverrides = async (institutionId) => {
  const overrides = {};
  if (!institutionId) return overrides;
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM institution_settings WHERE institution_id = $1 AND key = ANY($2)",
      [institutionId, SETTING_KEYS],
    );
    for (const row of rows) {
      if (row.key in SETTINGS_DEFAULTS && row.value !== null) {
        overrides[row.key] = row.value;
      }
    }
  } catch (error) {
    console.error(`[settings] institution read failed: ${error.message}`);
  }
  return overrides;
};

// Effective settings. Pass an institutionId to layer its overrides on top of the
// global values; omit it (or pass null) for the platform-wide settings.
export const getSettings = async (institutionId = null) => {
  const global = await getGlobalSettings();
  if (!institutionId) return global;

  const hit = instCache.get(institutionId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = { ...global, ...(await getInstitutionOverrides(institutionId)) };
  instCache.set(institutionId, { value, at: Date.now() });
  return value;
};

// No arg → clear everything (a global change shifts every institution's fallback).
// With an id → clear just that institution's cache.
export const invalidateSettingsCache = (institutionId = null) => {
  if (institutionId) {
    instCache.delete(institutionId);
    return;
  }
  cache = null;
  cachedAt = 0;
  instCache.clear();
};

export const getServiceFee = async (institutionId = null) =>
  Number((await getSettings(institutionId)).service_fee);

export const getCheckoutExpiryMinutes = async (institutionId = null) =>
  Number((await getSettings(institutionId)).checkout_expiry_minutes);

// The catalog entries that are currently enabled, in catalog order.
export const getEnabledPaymentMethods = async (institutionId = null) => {
  const enabled = (await getSettings(institutionId)).enabled_payment_methods || [];
  return PAYMENT_METHOD_CATALOG.filter((method) => enabled.includes(method.id));
};
