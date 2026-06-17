-- Platform-wide configurable settings, editable by super-admins from the admin
-- app instead of being hardcoded constants. One row per key; value is jsonb so
-- a key can hold a number, boolean, or list. Reads fall back to code defaults,
-- so an absent row never breaks cart/checkout.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp without time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);

-- Seed with the current hardcoded defaults so the admin UI shows real values.
INSERT INTO public.app_settings (key, value) VALUES
  ('service_fee', '1.5'::jsonb),
  ('checkout_expiry_minutes', '30'::jsonb),
  ('enabled_payment_methods',
   '["card","instant_eft","capitec_pay","absa_pay","snapscan","zapper","scan_to_pay","scode","mobicred"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
