-- Per-institution setting overrides. Same keys as app_settings, scoped to one
-- institution. Effective value = institution override -> global app_settings ->
-- hardcoded default. An absent row means "use the global value", so this table
-- can be empty and nothing changes.

CREATE TABLE IF NOT EXISTS public.institution_settings (
  institution_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp without time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT institution_settings_pkey PRIMARY KEY (institution_id, key),
  CONSTRAINT institution_settings_institution_id_fkey
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE
);
