import test from "node:test";
import assert from "node:assert/strict";
import {
  institutionDeleteError,
  orderCancelError,
  orderRefundError,
  parsePagination,
  userDeleteError,
  userUpdateError,
} from "./adminRules.js";

test("parsePagination returns no limit (all rows) when limit is missing or invalid", () => {
  assert.deepEqual(parsePagination({}), { limit: null, offset: 0 });
  assert.deepEqual(parsePagination({ limit: "0" }), { limit: null, offset: 0 });
  assert.deepEqual(parsePagination({ limit: "abc" }), { limit: null, offset: 0 });
  assert.deepEqual(parsePagination({ limit: "-5" }), { limit: null, offset: 0 });
});

test("parsePagination parses a valid limit/offset and defaults offset to 0", () => {
  assert.deepEqual(parsePagination({ limit: "10" }), { limit: 10, offset: 0 });
  assert.deepEqual(parsePagination({ limit: "10", offset: "20" }), {
    limit: 10,
    offset: 20,
  });
  // negative offset is clamped to 0
  assert.deepEqual(parsePagination({ limit: "10", offset: "-3" }), {
    limit: 10,
    offset: 0,
  });
});

test("userUpdateError allows valid edits and a self-reactivate", () => {
  assert.equal(userUpdateError({ isSelf: false }), null);
  assert.equal(userUpdateError({ status: "suspended", isSelf: false }), null);
  // an admin may set their own status back to approved
  assert.equal(userUpdateError({ status: "approved", isSelf: true }), null);
});

test("userUpdateError rejects invalid status and self-deactivation", () => {
  assert.deepEqual(userUpdateError({ status: "banished", isSelf: false }), {
    status: 400,
    message: "Invalid status",
  });
  assert.deepEqual(userUpdateError({ status: "suspended", isSelf: true }), {
    status: 400,
    message: "You cannot deactivate your own account",
  });
});

test("userDeleteError blocks self-delete and users with orders (self takes precedence)", () => {
  assert.equal(userDeleteError({ isSelf: false, hasOrders: false }), null);
  assert.deepEqual(userDeleteError({ isSelf: true, hasOrders: false }), {
    status: 400,
    message: "You cannot delete your own account",
  });
  assert.deepEqual(userDeleteError({ isSelf: false, hasOrders: true }), {
    status: 409,
    message: "This user has orders. Suspend them instead of deleting.",
  });
  // self-check wins even when the user also has orders
  assert.equal(userDeleteError({ isSelf: true, hasOrders: true }).status, 400);
});

test("orderCancelError allows active orders and blocks terminal ones", () => {
  assert.equal(orderCancelError("ready_for_collection"), null);
  assert.equal(orderCancelError("payment_pending"), null);
  assert.deepEqual(orderCancelError("collected"), {
    status: 409,
    message: "A collected order cannot be cancelled",
  });
  assert.deepEqual(orderCancelError("cancelled"), {
    status: 409,
    message: "Order is already cancelled",
  });
  assert.deepEqual(orderCancelError("expired"), {
    status: 409,
    message: "Order is already expired",
  });
});

test("institutionDeleteError blocks institutions with users or products", () => {
  assert.equal(
    institutionDeleteError({ hasUsers: false, hasProducts: false }),
    null,
  );
  assert.equal(
    institutionDeleteError({ hasUsers: true, hasProducts: false }).status,
    409,
  );
  assert.equal(
    institutionDeleteError({ hasUsers: false, hasProducts: true }).status,
    409,
  );
  // users take precedence in the message
  assert.match(
    institutionDeleteError({ hasUsers: true, hasProducts: true }).message,
    /has users/,
  );
});

test("orderRefundError only allows paid, uncollected orders", () => {
  assert.equal(
    orderRefundError({ status: "ready_for_collection", paymentStatus: "paid" }),
    null,
  );
  assert.deepEqual(
    orderRefundError({ status: "payment_pending", paymentStatus: "pending" }),
    { status: 400, message: "Only paid orders can be refunded" },
  );
  assert.deepEqual(
    orderRefundError({ status: "collected", paymentStatus: "paid" }),
    {
      status: 409,
      message: "Order was already collected; handle this as a manual dispute",
    },
  );
});
