import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import {
  getAppSettings,
  updateAppSettings,
} from "../controllers/adminSettingsController.js";
import {
  getServiceFee,
  invalidateSettingsCache,
} from "../services/settingsService.js";
import { mockRes, pool, truncateAll } from "./helpers.js";

const superReq = (body = {}) => ({
  user: { id: "00000000-0000-0000-0000-000000000001", role: "super_admin" },
  body,
});

before(async () => {
  assert.ok(
    process.env.TEST_DATABASE_URL &&
      !/thriftstore$/.test(process.env.TEST_DATABASE_URL),
    "refusing to run integration tests outside a test database",
  );
});
// The settings cache is module-level, so clear it between tests too.
beforeEach(async () => {
  await truncateAll();
  invalidateSettingsCache();
});
after(() => pool.end());

test("getAppSettings returns code defaults + the catalog when nothing is stored", async () => {
  const res = mockRes();
  await getAppSettings(superReq(), res);

  assert.equal(res.body.settings.service_fee, 1.5);
  assert.equal(res.body.settings.checkout_expiry_minutes, 30);
  assert.ok(res.body.payment_method_catalog.length >= 6);
});

test("updateAppSettings persists a fee that getServiceFee then reflects", async () => {
  const res = mockRes();
  await updateAppSettings(superReq({ service_fee: 9.99 }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.settings.service_fee, 9.99);

  invalidateSettingsCache();
  assert.equal(await getServiceFee(), 9.99);
});

test("updateAppSettings rejects an invalid fee and changes nothing", async () => {
  const res = mockRes();
  await updateAppSettings(superReq({ service_fee: -5 }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(await getServiceFee(), 1.5);
});
