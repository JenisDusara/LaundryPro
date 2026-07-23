-- Link a labour payout to the expense row it creates, so deleting the payout can also remove the
-- matching expense (keeps accounting reconciled). Idempotent.
ALTER TABLE "labour_payments"
ADD COLUMN IF NOT EXISTS "expense_id" TEXT NOT NULL DEFAULT '';
