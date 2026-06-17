import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import {
  listPayments,
  recoverPayment,
} from "../controllers/adminPaymentController.js";
import {
  getOrderStatus,
  mockRes,
  pool,
  seedOrder,
  truncateAll,
} from "./helpers.js";

const superReq = (extra = {}) => ({
  user: { id: "00000000-0000-0000-0000-000000000001", role: "super_admin" },
  ...extra,
});

before(async () => {
  assert.ok(
    process.env.TEST_DATABASE_URL &&
      !/thriftstore$/.test(process.env.TEST_DATABASE_URL),
    "refusing to run integration tests outside a test database",
  );
});
beforeEach(truncateAll);
after(() => pool.end());

test("listPayments returns the payment joined to its order, with summary", async () => {
  await seedOrder({ orderStatus: "ready_for_collection", paymentStatus: "paid" });

  const res = mockRes();
  await listPayments(superReq({ query: {} }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.payments[0].order_reference.startsWith("ORD-"), true);
  assert.equal(res.body.payments[0].status, "paid");
  // summary totals the filtered set
  assert.equal(Number(res.body.summary.total_paid) > 0, true);
});

test("listPayments filters by status", async () => {
  await seedOrder({ orderStatus: "ready_for_collection", paymentStatus: "paid" });
  await seedOrder({ orderStatus: "payment_pending", paymentStatus: "pending" });

  const res = mockRes();
  await listPayments(superReq({ query: { status: "pending" } }), res);

  assert.equal(res.body.total, 1);
  assert.equal(res.body.payments[0].status, "pending");
});

test("recoverPayment marks a stuck pending order as paid", async () => {
  const { order } = await seedOrder({
    orderStatus: "payment_pending",
    paymentStatus: "pending",
    productStatus: "Pending",
  });

  const res = mockRes();
  await recoverPayment(
    superReq({ params: { orderReference: order.order_reference }, body: {} }),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(
    await getOrderStatus(order.order_reference),
    "ready_for_collection",
  );
});
