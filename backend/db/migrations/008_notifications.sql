-- In-app notifications for end users (parents/students). One row per event the
-- user should see in the customer app's notification bell — the in-app
-- counterpart to the transactional emails already sent (order ready, payment
-- failed, registration approved/rejected). Read state is per-notification.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  body text,
  entity_type character varying(40),
  entity_ref character varying(100),
  link character varying(255),
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE
);

-- Newest-first listing per user.
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- Fast unread-count / unread-list per user.
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;
