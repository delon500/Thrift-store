-- QR lost-and-found tags (Phase 1: registry + batches).
--
-- A school buys pre-printed QR stickers. Each sticker is one `item_tags` row.
-- Two identifiers per tag, on purpose:
--   * code  — human-readable, sequential (TAG-2026-000123), printed as text for
--             admin/support reference.
--   * token — random, unguessable, set app-side; this is what the QR encodes and
--             what activation/scanning use. Keeps codes from being enumerable.
-- Tags are generated unactivated and assigned to an institution in a batch; a
-- parent/student activates one later (Phase 2) which binds owner + label.

CREATE TABLE IF NOT EXISTS public.tag_batches (
  id             uuid NOT NULL DEFAULT public.uuid_generate_v4(),
  institution_id uuid NOT NULL,
  quantity       integer NOT NULL,
  note           text,
  created_by     uuid,
  created_at     timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT tag_batches_pkey PRIMARY KEY (id),
  CONSTRAINT tag_batches_quantity_check CHECK (quantity > 0 AND quantity <= 1000),
  CONSTRAINT tag_batches_institution_id_fkey
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE,
  CONSTRAINT tag_batches_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE SEQUENCE IF NOT EXISTS public.tag_reference_seq;

CREATE TABLE IF NOT EXISTS public.item_tags (
  id             uuid NOT NULL DEFAULT public.uuid_generate_v4(),
  code           character varying(50) NOT NULL DEFAULT
                   ((('TAG-'::text || to_char(now(), 'YYYY'::text)) || '-'::text)
                    || lpad((nextval('public.tag_reference_seq'::regclass))::text, 6, '0'::text)),
  token          character varying(32) NOT NULL,
  batch_id       uuid NOT NULL,
  institution_id uuid NOT NULL,
  status         character varying(20) NOT NULL DEFAULT 'unactivated',
  owner_user_id  uuid,
  owner_child_id uuid,                       -- FK added in Phase 0 (child_profiles)
  label          character varying(120),
  activated_at   timestamp without time zone,
  created_at     timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_tags_pkey PRIMARY KEY (id),
  CONSTRAINT item_tags_status_check CHECK (
    status IN ('unactivated', 'active', 'reported_found', 'returned', 'retired')
  ),
  CONSTRAINT item_tags_batch_id_fkey
    FOREIGN KEY (batch_id) REFERENCES public.tag_batches(id) ON DELETE CASCADE,
  CONSTRAINT item_tags_institution_id_fkey
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE,
  CONSTRAINT item_tags_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS item_tags_code_idx ON public.item_tags (code);
CREATE UNIQUE INDEX IF NOT EXISTS item_tags_token_idx ON public.item_tags (token);
CREATE INDEX IF NOT EXISTS item_tags_inst_status_idx
  ON public.item_tags (institution_id, status);
CREATE INDEX IF NOT EXISTS item_tags_batch_idx ON public.item_tags (batch_id);
