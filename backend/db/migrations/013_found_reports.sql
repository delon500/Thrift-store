-- Found reports (Phase 3). When school staff scan an active tag on a lost item,
-- a found_report is opened and the owner is notified. The owner brings the
-- LF-... reference to collect; staff mark it returned (which frees the tag back
-- to 'active' so the same sticker can be found again later).

CREATE SEQUENCE IF NOT EXISTS public.found_report_reference_seq;

CREATE TABLE IF NOT EXISTS public.found_reports (
  id               uuid NOT NULL DEFAULT public.uuid_generate_v4(),
  reference        character varying(50) NOT NULL DEFAULT
                     ((('LF-'::text || to_char(now(), 'YYYY'::text)) || '-'::text)
                      || lpad((nextval('public.found_report_reference_seq'::regclass))::text, 6, '0'::text)),
  tag_id           uuid NOT NULL,
  institution_id   uuid NOT NULL,
  found_by_user_id uuid,
  status           character varying(20) NOT NULL DEFAULT 'open',
  found_at         timestamp without time zone NOT NULL DEFAULT now(),
  returned_at      timestamp without time zone,
  CONSTRAINT found_reports_pkey PRIMARY KEY (id),
  CONSTRAINT found_reports_status_check CHECK (status IN ('open', 'returned')),
  CONSTRAINT found_reports_tag_id_fkey
    FOREIGN KEY (tag_id) REFERENCES public.item_tags(id) ON DELETE CASCADE,
  CONSTRAINT found_reports_institution_id_fkey
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE,
  CONSTRAINT found_reports_found_by_user_id_fkey
    FOREIGN KEY (found_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS found_reports_reference_idx
  ON public.found_reports (reference);
CREATE INDEX IF NOT EXISTS found_reports_inst_status_idx
  ON public.found_reports (institution_id, status);
