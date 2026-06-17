import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";
import {
  listNotifications,
  markRead,
  unreadCount,
} from "../controllers/notificationController.js";
import { mockRes, pool, seedOrder, truncateAll } from "./helpers.js";

const reqAs = (userId, extra = {}) => ({
  user: { id: userId },
  query: {},
  params: {},
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

test("listNotifications returns the user's notifications with an unread count", async () => {
  const { user } = await seedOrder();
  await createNotification({
    userId: user.id,
    type: "order_ready",
    title: "Your order is ready to collect",
    body: "Payment confirmed.",
  });

  const res = mockRes();
  await listNotifications(reqAs(user.id), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.unread, 1);
  assert.equal(res.body.notifications[0].type, "order_ready");
});

test("markRead clears the unread count", async () => {
  const { user } = await seedOrder();
  await createNotification({
    userId: user.id,
    type: "payment_failed",
    title: "Payment failed",
  });

  const list = mockRes();
  await listNotifications(reqAs(user.id), list);
  const id = list.body.notifications[0].id;

  const readRes = mockRes();
  await markRead(reqAs(user.id, { params: { id } }), readRes);

  const countRes = mockRes();
  await unreadCount(reqAs(user.id), countRes);
  assert.equal(countRes.body.unread, 0);
});

test("a user cannot see another user's notifications", async () => {
  const a = await seedOrder();
  const b = await seedOrder();
  await createNotification({
    userId: a.user.id,
    type: "order_ready",
    title: "For A only",
  });

  const res = mockRes();
  await listNotifications(reqAs(b.user.id), res);
  assert.equal(res.body.total, 0);
});
