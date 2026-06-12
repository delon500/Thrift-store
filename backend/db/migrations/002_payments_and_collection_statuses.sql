-- Payment tracking and admin collection management.

DO $$
BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_order_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.collection_order_status'::regtype
        AND enumlabel = 'payment_pending'
    ) THEN
      ALTER TYPE public.collection_order_status ADD VALUE 'payment_pending';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.collection_order_status'::regtype
        AND enumlabel = 'paid'
    ) THEN
      ALTER TYPE public.collection_order_status ADD VALUE 'paid';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.collection_order_status'::regtype
        AND enumlabel = 'ready_for_collection'
    ) THEN
      ALTER TYPE public.collection_order_status ADD VALUE 'ready_for_collection';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.collection_order_status'::regtype
        AND enumlabel = 'payment_failed'
    ) THEN
      ALTER TYPE public.collection_order_status ADD VALUE 'payment_failed';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payments
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  collection_order_id uuid NOT NULL,
  provider character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'manual',
  provider_payment_id character varying(150) COLLATE pg_catalog."default",
  payment_method character varying(80) COLLATE pg_catalog."default" NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount numeric(10, 2) NOT NULL,
  currency character varying(3) COLLATE pg_catalog."default" NOT NULL DEFAULT 'ZAR',
  paid_at timestamp without time zone,
  failed_at timestamp without time zone,
  raw_webhook_payload jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_collection_order_id_fkey FOREIGN KEY (collection_order_id)
    REFERENCES public.collection_orders (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx
  ON public.payments (collection_order_id);

CREATE INDEX IF NOT EXISTS payments_provider_payment_id_idx
  ON public.payments (provider_payment_id);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON public.payments (status);

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.payments IS
  'Payment records linked to collection orders. Gateway webhooks update these records.';
