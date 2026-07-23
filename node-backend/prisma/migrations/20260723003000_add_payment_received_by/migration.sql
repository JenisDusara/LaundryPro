-- Track which staff/admin recorded a payment, so payment history can show "received by …".
-- Idempotent so it is safe to re-run against an environment where the columns already exist.
ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "received_by" TEXT NOT NULL DEFAULT '';
ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "received_by_username" TEXT NOT NULL DEFAULT '';
