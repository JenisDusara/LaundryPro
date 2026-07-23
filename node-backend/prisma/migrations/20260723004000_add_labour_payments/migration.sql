-- Records an actual payout to a labourer (settling their net payable for a month).
-- Separate from advances: an advance is money given ahead of work; a payment settles the balance.
-- Idempotent so it is safe to re-run against an environment where it already exists.
CREATE TABLE IF NOT EXISTS "labour_payments" (
  "id" TEXT NOT NULL,
  "labour_id" TEXT NOT NULL,
  "period" TEXT NOT NULL DEFAULT '',
  "pay_date" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'cash',
  "note" TEXT NOT NULL DEFAULT '',
  "shop_id" TEXT NOT NULL DEFAULT 'shop1',
  "paid_by" TEXT NOT NULL DEFAULT '',
  "paid_by_username" TEXT NOT NULL DEFAULT '',
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "labour_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "labour_payments_shop_id_idx" ON "labour_payments" ("shop_id");
CREATE INDEX IF NOT EXISTS "labour_payments_labour_id_idx" ON "labour_payments" ("labour_id");
CREATE INDEX IF NOT EXISTS "labour_payments_pay_date_idx" ON "labour_payments" ("pay_date");
