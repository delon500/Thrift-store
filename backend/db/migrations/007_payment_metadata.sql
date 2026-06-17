-- Payment Management: richer failure / refund trail on payments so admins can
-- investigate failed payments and reconcile refunds without parsing the raw ITN.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refunded_by uuid;
