-- Lost & found via Inventory: a product created from a found item can link to
-- the sticker (item_tags) it was matched to, so we know whose item it was and
-- can avoid re-notifying. Optional — most products have no sticker.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS found_tag_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_found_tag_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_found_tag_id_fkey
      FOREIGN KEY (found_tag_id) REFERENCES public.item_tags(id) ON DELETE SET NULL;
  END IF;
END $$;
