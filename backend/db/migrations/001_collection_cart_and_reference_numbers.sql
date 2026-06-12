-- Collection cart and reference-number order model.
-- Run this after the current institutions/users/products/product_images schema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS public.product_reference_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.collection_order_reference_seq START WITH 1 INCREMENT BY 1;

DO $$
BEGIN
  CREATE TYPE public.cart_status AS ENUM ('active', 'checked_out', 'abandoned');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.collection_order_status AS ENUM (
    'confirmed',
    'collected',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.collection_order_item_status AS ENUM (
    'reserved',
    'collected',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.product_status'::regtype
        AND enumlabel = 'Reserved'
    ) THEN
      ALTER TYPE public.product_status ADD VALUE 'Reserved';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.product_status'::regtype
        AND enumlabel = 'Claimed'
    ) THEN
      ALTER TYPE public.product_status ADD VALUE 'Claimed';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.product_status'::regtype
        AND enumlabel = 'Cancelled'
    ) THEN
      ALTER TYPE public.product_status ADD VALUE 'Cancelled';
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS reference_number character varying(50);

UPDATE public.products
SET reference_number = 'ITEM-' || upper(substr(replace(id::text, '-', ''), 1, 12))
WHERE reference_number IS NULL;

ALTER TABLE IF EXISTS public.products
  ALTER COLUMN reference_number SET NOT NULL;

ALTER TABLE IF EXISTS public.products
  ALTER COLUMN reference_number SET DEFAULT (
    'ITEM-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.product_reference_seq')::text, 6, '0')
  );

CREATE UNIQUE INDEX IF NOT EXISTS products_reference_number_idx
  ON public.products (reference_number);

CREATE INDEX IF NOT EXISTS products_listing_type_idx
  ON public.products (listing_type);

CREATE INDEX IF NOT EXISTS products_reference_status_idx
  ON public.products (reference_number, status);

CREATE TABLE IF NOT EXISTS public.carts
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  status public.cart_status NOT NULL DEFAULT 'active',
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_cart_per_user_idx
  ON public.carts (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS carts_user_status_idx
  ON public.carts (user_id, status);

CREATE TABLE IF NOT EXISTS public.cart_items
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_product_key UNIQUE (cart_id, product_id),
  CONSTRAINT cart_items_quantity_check CHECK (quantity = 1),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id)
    REFERENCES public.carts (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES public.products (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx
  ON public.cart_items (cart_id);

CREATE INDEX IF NOT EXISTS cart_items_product_id_idx
  ON public.cart_items (product_id);

CREATE TABLE IF NOT EXISTS public.collection_orders
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_reference character varying(50) NOT NULL DEFAULT (
    'ORD-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.collection_order_reference_seq')::text, 6, '0')
  ),
  user_id uuid NOT NULL,
  institution_id uuid NOT NULL,
  status public.collection_order_status NOT NULL DEFAULT 'confirmed',
  user_full_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
  user_email character varying(255) COLLATE pg_catalog."default" NOT NULL,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  service_fee numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  collection_note text COLLATE pg_catalog."default",
  email_sent_at timestamp without time zone,
  expires_at timestamp without time zone,
  collected_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT collection_orders_pkey PRIMARY KEY (id),
  CONSTRAINT collection_orders_order_reference_key UNIQUE (order_reference),
  CONSTRAINT collection_orders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  CONSTRAINT collection_orders_institution_id_fkey FOREIGN KEY (institution_id)
    REFERENCES public.institutions (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS collection_orders_user_status_idx
  ON public.collection_orders (user_id, status);

CREATE INDEX IF NOT EXISTS collection_orders_institution_status_idx
  ON public.collection_orders (institution_id, status);

CREATE INDEX IF NOT EXISTS collection_orders_reference_idx
  ON public.collection_orders (order_reference);

CREATE TABLE IF NOT EXISTS public.collection_order_items
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  collection_order_id uuid NOT NULL,
  product_id uuid,
  product_reference_number character varying(50) COLLATE pg_catalog."default" NOT NULL,
  listing_type public.listing_type NOT NULL,
  product_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
  institution_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  item_status public.collection_order_item_status NOT NULL DEFAULT 'reserved',
  collected_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT collection_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT collection_order_items_reference_key UNIQUE (product_reference_number),
  CONSTRAINT collection_order_items_quantity_check CHECK (quantity = 1),
  CONSTRAINT collection_order_items_order_id_fkey FOREIGN KEY (collection_order_id)
    REFERENCES public.collection_orders (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  CONSTRAINT collection_order_items_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES public.products (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS collection_order_items_order_id_idx
  ON public.collection_order_items (collection_order_id);

CREATE INDEX IF NOT EXISTS collection_order_items_product_id_idx
  ON public.collection_order_items (product_id);

CREATE INDEX IF NOT EXISTS collection_order_items_reference_status_idx
  ON public.collection_order_items (product_reference_number, item_status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_carts_updated_at ON public.carts;
CREATE TRIGGER set_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER set_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_collection_orders_updated_at ON public.collection_orders;
CREATE TRIGGER set_collection_orders_updated_at
BEFORE UPDATE ON public.collection_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_collection_order_items_updated_at ON public.collection_order_items;
CREATE TRIGGER set_collection_order_items_updated_at
BEFORE UPDATE ON public.collection_order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.products.reference_number IS
  'Permanent item reference shown in-app and emailed to users for school collection.';

COMMENT ON TABLE public.collection_orders IS
  'Confirmed user collection records for thrift store purchases and lost-and-found claims.';

COMMENT ON COLUMN public.collection_orders.order_reference IS
  'Order-level reference for the user collection transaction.';

COMMENT ON COLUMN public.collection_order_items.product_reference_number IS
  'Snapshot of the item reference number used by the school to verify collection.';

COMMENT ON COLUMN public.collection_order_items.listing_type IS
  'Snapshot of whether the collected item came from Thrift Store or Lost and Found.';
