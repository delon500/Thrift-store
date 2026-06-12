import test from "node:test";
import assert from "node:assert/strict";
import { calculateCartSummary, serializeCart } from "./cartController.js";

test("calculateCartSummary totals one-off school collection items", () => {
  const summary = calculateCartSummary([
    { price: "120.00", quantity: 1 },
    { price: "35.50", quantity: 1 },
  ]);

  assert.deepEqual(summary, {
    subtotal: 155.5,
    service_fee: 1.5,
    total: 157,
    total_items: 2,
  });
});

test("serializeCart includes item references and listing types", () => {
  const cart = serializeCart({
    cartId: "cart-1",
    status: "active",
    rows: [
      {
        cart_item_id: "cart-item-1",
        product_id: "product-1",
        name: "School Jersey",
        price: "75.00",
        quantity: 1,
        schoolName: "North High",
        image: ["https://example.com/jersey.jpg"],
        reference_number: "ITEM-2026-000001",
        listing_type: "Thrift Store",
        condition: "Good",
        status: "Available",
      },
    ],
  });

  assert.equal(cart.id, "cart-1");
  assert.equal(cart.items[0].reference_number, "ITEM-2026-000001");
  assert.equal(cart.items[0].listing_type, "Thrift Store");
  assert.equal(cart.summary.total, 76.5);
});
