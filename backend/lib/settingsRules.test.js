import test from "node:test";
import assert from "node:assert/strict";
import { validateSettingsPatch } from "./settingsRules.js";

const CATALOG = ["card", "instant_eft", "snapscan"];

test("accepts and rounds a valid service fee", () => {
  const { value, error } = validateSettingsPatch({ service_fee: 2.005 }, CATALOG);
  assert.equal(error, undefined);
  assert.equal(value.service_fee, 2.01);
});

test("rejects a negative service fee", () => {
  const { error } = validateSettingsPatch({ service_fee: -1 }, CATALOG);
  assert.match(error, /Service fee/);
});

test("rejects a non-integer or out-of-range checkout expiry", () => {
  assert.match(
    validateSettingsPatch({ checkout_expiry_minutes: 2 }, CATALOG).error,
    /Checkout expiry/,
  );
  assert.match(
    validateSettingsPatch({ checkout_expiry_minutes: 12.5 }, CATALOG).error,
    /Checkout expiry/,
  );
});

test("requires at least one enabled payment method", () => {
  assert.match(
    validateSettingsPatch({ enabled_payment_methods: [] }, CATALOG).error,
    /at least one/,
  );
});

test("rejects unknown payment method ids", () => {
  assert.match(
    validateSettingsPatch(
      { enabled_payment_methods: ["card", "bitcoin"] },
      CATALOG,
    ).error,
    /Unknown payment method/,
  );
});

test("dedupes a valid enabled list", () => {
  const { value } = validateSettingsPatch(
    { enabled_payment_methods: ["card", "card", "snapscan"] },
    CATALOG,
  );
  assert.deepEqual(value.enabled_payment_methods, ["card", "snapscan"]);
});

test("rejects an empty patch", () => {
  assert.match(validateSettingsPatch({}, CATALOG).error, /No valid settings/);
});
