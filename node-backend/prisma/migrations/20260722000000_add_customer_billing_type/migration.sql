ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "billing_type" TEXT NOT NULL DEFAULT 'per_order';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_billing_type_check'
  ) THEN
    ALTER TABLE "customers"
    ADD CONSTRAINT "customers_billing_type_check"
    CHECK ("billing_type" IN ('per_order', 'monthly'));
  END IF;
END $$;
