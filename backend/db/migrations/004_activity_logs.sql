-- Activity / audit log: one row per meaningful event in the app (logins,
-- registrations, approvals, orders, payments, collections, product changes).
-- Powers the admin dashboard metrics, the activity feed, and the charts.

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  action character varying(60) NOT NULL,
  actor_id uuid,
  actor_role character varying(30),
  actor_name character varying(255),
  institution_id uuid,
  entity_type character varying(40),
  entity_id character varying(100),
  entity_ref character varying(100),
  description text,
  metadata jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
  ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx
  ON public.activity_logs (action);
CREATE INDEX IF NOT EXISTS activity_logs_actor_idx
  ON public.activity_logs (actor_id);
CREATE INDEX IF NOT EXISTS activity_logs_institution_idx
  ON public.activity_logs (institution_id);
