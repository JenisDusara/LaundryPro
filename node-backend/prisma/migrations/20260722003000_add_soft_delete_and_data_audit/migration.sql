ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

ALTER TABLE "expenses"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

ALTER TABLE "labour_work"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

ALTER TABLE "labour_advances"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "deleted_by_username" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "delete_reason" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "data_action_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" TEXT NOT NULL,
  "actor_username" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "entity_label" TEXT NOT NULL DEFAULT '',
  "metadata" JSONB,
  "ip" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customers_deleted_at_idx" ON "customers"("deleted_at");
CREATE INDEX IF NOT EXISTS "laundry_entries_deleted_at_idx" ON "laundry_entries"("deleted_at");
CREATE INDEX IF NOT EXISTS "payments_deleted_at_idx" ON "payments"("deleted_at");
CREATE INDEX IF NOT EXISTS "expenses_deleted_at_idx" ON "expenses"("deleted_at");
CREATE INDEX IF NOT EXISTS "labour_work_deleted_at_idx" ON "labour_work"("deleted_at");
CREATE INDEX IF NOT EXISTS "labour_advances_deleted_at_idx" ON "labour_advances"("deleted_at");
CREATE INDEX IF NOT EXISTS "data_action_logs_shop_id_idx" ON "data_action_logs"("shop_id");
CREATE INDEX IF NOT EXISTS "data_action_logs_action_idx" ON "data_action_logs"("action");
CREATE INDEX IF NOT EXISTS "data_action_logs_entity_type_idx" ON "data_action_logs"("entity_type");
CREATE INDEX IF NOT EXISTS "data_action_logs_entity_id_idx" ON "data_action_logs"("entity_id");
CREATE INDEX IF NOT EXISTS "data_action_logs_created_at_idx" ON "data_action_logs"("created_at");
