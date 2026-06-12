import test from "node:test";
import assert from "node:assert/strict";
import {
  getPaymentMethod,
  normalizePaymentMethod,
  PAYMENT_METHODS,
} from "./checkoutController.js";

test("normalizePaymentMethod returns supported South African payment methods", () => {
  assert.equal(normalizePaymentMethod("capitec_pay").label, "Capitec Pay");
  assert.equal(normalizePaymentMethod("instant_eft").label, "Instant EFT");
  assert.equal(normalizePaymentMethod("zapper").label, "Zapper");
});

test("getPaymentMethod rejects unsupported methods", () => {
  assert.throws(() => getPaymentMethod("raw_card_details"), /Unsupported payment method/);
});

test("PAYMENT_METHODS exposes checkout choices for the frontend", () => {
  assert.ok(PAYMENT_METHODS.length >= 6);
  assert.ok(PAYMENT_METHODS.some((method) => method.id === "card"));
  assert.ok(PAYMENT_METHODS.some((method) => method.id === "instant_eft"));
});
