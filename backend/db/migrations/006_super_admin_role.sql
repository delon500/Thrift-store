-- Two-tier platform admin: 'super_admin' (full control) and 'admin'
-- (operational). Apply the two statements SEPARATELY — a newly added enum value
-- cannot be used in the same transaction that adds it.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Promote the existing all-powerful admins. New admins created via registerAdmin
-- stay the limited 'admin' tier.
UPDATE public.users SET role = 'super_admin' WHERE role = 'admin';
