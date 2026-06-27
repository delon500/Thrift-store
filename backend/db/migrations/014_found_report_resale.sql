-- Phase 4: unclaimed found items can be listed for resale. A found_report can
-- become 'resold', linked to the products row that was created from it.

ALTER TABLE public.found_reports
  DROP CONSTRAINT IF EXISTS found_reports_status_check;
ALTER TABLE public.found_reports
  ADD CONSTRAINT found_reports_status_check
  CHECK (status IN ('open', 'returned', 'resold'));

ALTER TABLE public.found_reports
  ADD COLUMN IF NOT EXISTS product_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'found_reports_product_id_fkey'
  ) THEN
    ALTER TABLE public.found_reports
      ADD CONSTRAINT found_reports_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;
