-- Link a labour advance to the expense row it creates. An advance is cash paid to the worker, so
-- it belongs in the expense ledger too (alongside settlement payouts). Idempotent.
ALTER TABLE "labour_advances"
ADD COLUMN IF NOT EXISTS "expense_id" TEXT NOT NULL DEFAULT '';
