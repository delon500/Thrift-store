import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import {
  cancelOrder,
  refundOrder,
} from "../controllers/adminOrderController.js";
import {
  getOrderStatus,
  getPaymentStatus,
  getProductStatus,
  mockRes,
  pool,
  seedOrder,
  truncateAll,
} from "./helpers.js";

// Only run when pointed at a test database (the runner guarantees this).
const skip = !process.env.TEST_DATABASE_URL;
const adminReq = (orderReference) => ({
  params: { orderReference },
  user: { id: "00000000-0000-0000-0000-000000000001", role: "admin" },
});

before(async () => {
  // Sanity: never run against the dev/prod database.
  assert.ok(
    process.env.TEST_DATABASE_URL &&
      !/thriftstore$/.test(process.env.TEST_DATABASE_URL),
    "refusing to run integration tests outside a test database",
  );
});

beforeEach(truncateAll);
after(() => pool.end());

test("refundOrder refunds a paid order and releases the product", { skip }, async () => {
  const { order, product } = await seedOrder({
    orderStatus: "ready_for_collection",
    paymentStatus: "paid",
    productStatus: "Reserved",
  });

  const res = mockRes();
  await refundOrder(adminReq(order.order_reference), res);

  assert.equal(res.statusCode, 200);
  assert.equal(await getOrderStatus(order.order_reference), "cancelled");
  assert.equal(await getPaymentStatus(order.order_reference), "refunded");
  assert.equal(await getProductStatus(product.id), "Available");
});

test("refundOrder rejects an unpaid order and changes nothing", { skip }, async () => {
  const { order, product } = await seedOrder({
    orderStatus: "payment_pending",
    paymentStatus: "pending",
    productStatus: "Pending",
  });

  const res = mockRes();
  await refundOrder(adminReq(order.order_reference), res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Only paid orders/);
  // unchanged
  assert.equal(await getOrderStatus(order.order_reference), "payment_pending");
  assert.equal(await getProductStatus(product.id), "Pending");
});

test("cancelOrder releases a held product and cancels the order", { skip }, async () => {
  const { order, product } = await seedOrder({
    orderStatus: "payment_pending",
    paymentStatus: "pending",
    productStatus: "Pending",
  });

  const res = mockRes();
  await cancelOrder(adminReq(order.order_reference), res);

  assert.equal(res.statusCode, 200);
  assert.equal(await getOrderStatus(order.order_reference), "cancelled");
  assert.equal(await getProductStatus(product.id), "Available");
});

test("cancelOrder refuses to cancel a collected order", { skip }, async () => {
  const { order } = await seedOrder({
    orderStatus: "collected",
    paymentStatus: "paid",
    productStatus: "Claimed",
  });

  const res = mockRes();
  await cancelOrder(adminReq(order.order_reference), res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /collected order cannot be cancelled/);
  assert.equal(await getOrderStatus(order.order_reference), "collected");
});
