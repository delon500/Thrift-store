-- A product may legitimately be ordered again after a previous order was
-- cancelled or expired, so product_reference_number must NOT be globally unique
-- on collection_order_items. Double-active-ordering is already prevented by the
-- product status check in checkout (a product must be 'Available'). Drop the
-- unique index that was causing "duplicate key" / "Checkout failed".

-- Dropping the constraint also drops its backing unique index. The bare
-- DROP INDEX afterwards covers installs where it exists only as an index.
ALTER TABLE IF EXISTS public.collection_order_items
  DROP CONSTRAINT IF EXISTS collection_order_items_reference_key;

DROP INDEX IF EXISTS public.collection_order_items_reference_key;
