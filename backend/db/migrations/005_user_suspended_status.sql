-- Add a 'suspended' approval status so admins can deactivate an approved user
-- (distinct from 'rejected', which is for declined sign-ups). The login gate
-- already blocks anything that is not 'approved'.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.approval_status'::regtype
      AND enumlabel = 'suspended'
  ) THEN
    ALTER TYPE public.approval_status ADD VALUE 'suspended';
  END IF;
END $$;
