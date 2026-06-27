-- Family / guardian model (Phase 0). A guardian (a parent user) can have:
--   * child_profiles — dependents with NO login (young learners). The guardian
--     owns them and receives their alerts. The primary mechanism, since young
--     learners have no account of their own.
--   * guardianship links to existing student ACCOUNTS (older students who log in
--     themselves) so a parent can also be alerted for them.
-- A QR tag (item_tags) is later activated against either a user (owner_user_id)
-- or a child profile (owner_child_id) — the FK for the latter is wired here.

CREATE TABLE IF NOT EXISTS public.child_profiles (
  id               uuid NOT NULL DEFAULT public.uuid_generate_v4(),
  guardian_user_id uuid NOT NULL,
  full_name        character varying(120) NOT NULL,
  grade            character varying(40),
  institution_id   uuid NOT NULL,
  created_at       timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT child_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT child_profiles_guardian_fkey
    FOREIGN KEY (guardian_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT child_profiles_institution_fkey
    FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS child_profiles_guardian_idx
  ON public.child_profiles (guardian_user_id);

CREATE TABLE IF NOT EXISTS public.guardianship (
  guardian_user_id uuid NOT NULL,
  student_user_id  uuid NOT NULL,
  created_at       timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT guardianship_pkey PRIMARY KEY (guardian_user_id, student_user_id),
  CONSTRAINT guardianship_guardian_fkey
    FOREIGN KEY (guardian_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT guardianship_student_fkey
    FOREIGN KEY (student_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS guardianship_student_idx
  ON public.guardianship (student_user_id);

-- Wire the FK from item_tags.owner_child_id (added unconstrained in 011).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_tags_owner_child_fkey'
  ) THEN
    ALTER TABLE public.item_tags
      ADD CONSTRAINT item_tags_owner_child_fkey
      FOREIGN KEY (owner_child_id)
      REFERENCES public.child_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
