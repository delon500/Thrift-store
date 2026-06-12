import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSignatureString,
  generatePayFastSignature,
  isMatchingAmount,
  verifyPayFastSignature,
} from "./payfastService.js";

const withPayFastEnv = (fn) => {
  const previous = {
    PAYFAST_MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID,
    PAYFAST_MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY,
    PAYFAST_PASSPHRASE: process.env.PAYFAST_PASSPHRASE,
  };

  process.env.PAYFAST_MERCHANT_ID = "10000100";
  process.env.PAYFAST_MERCHANT_KEY = "46f0cd694581a";
  process.env.PAYFAST_PASSPHRASE = "sandbox-passphrase";

  try {
    fn();
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
};

test("buildSignatureString excludes empty values and appends passphrase", () => {
  const signatureString = buildSignatureString(
    {
      merchant_id: "10000100",
      item_name: "School collection ORD-123",
      empty_value: "",
      signature: "ignored",
    },
    "sandbox passphrase",
  );

  assert.equal(
    signatureString,
    "merchant_id=10000100&item_name=School+collection+ORD-123&passphrase=sandbox+passphrase",
  );
});

test("verifyPayFastSignature accepts matching PayFast payload signatures", () => {
  withPayFastEnv(() => {
    const payload = {
      m_payment_id: "ORD-2026-000001",
      pf_payment_id: "123456",
      payment_status: "COMPLETE",
      amount_gross: "150.00",
    };

    const signature = generatePayFastSignature(
      payload,
      process.env.PAYFAST_PASSPHRASE,
    );

    assert.equal(verifyPayFastSignature({ ...payload, signature }), true);
    assert.equal(
      verifyPayFastSignature({ ...payload, signature: "tampered" }),
      false,
    );
  });
});

test("isMatchingAmount compares payment amounts to two decimals", () => {
  assert.equal(isMatchingAmount("150", "150.00"), true);
  assert.equal(isMatchingAmount("150.01", "150.00"), false);
});
