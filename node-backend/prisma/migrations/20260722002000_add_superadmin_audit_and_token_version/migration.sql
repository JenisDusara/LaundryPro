ALTER TABLE "admins"
ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "superadmin_action_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" TEXT NOT NULL,
  "actor_username" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_admin_id" TEXT NOT NULL DEFAULT '',
  "target_shop_id" TEXT NOT NULL DEFAULT '',
  "target_shop_name" TEXT NOT NULL DEFAULT '',
  "metadata" JSONB,
  "ip" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "superadmin_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "superadmin_action_logs_actor_id_idx" ON "superadmin_action_logs"("actor_id");
CREATE INDEX IF NOT EXISTS "superadmin_action_logs_target_shop_id_idx" ON "superadmin_action_logs"("target_shop_id");
CREATE INDEX IF NOT EXISTS "superadmin_action_logs_action_idx" ON "superadmin_action_logs"("action");
CREATE INDEX IF NOT EXISTS "superadmin_action_logs_created_at_idx" ON "superadmin_action_logs"("created_at");
