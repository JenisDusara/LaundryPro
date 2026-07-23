-- Safety follow-up for QR garment tags.
-- If the original QR migration has already run in an environment, this adds the
-- per-garment uniqueness guard needed to prevent duplicate "Saree 1/5" rows
-- during concurrent tag generation. If the original migration is fresh, this is
-- a no-op because it already creates the same index.
CREATE UNIQUE INDEX IF NOT EXISTS "entry_item_tags_entry_item_id_seq_key"
ON "entry_item_tags" ("entry_item_id", "seq");

CREATE TABLE IF NOT EXISTS "qr_tag_events" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "token" TEXT NOT NULL DEFAULT '',
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT '',
  "mode" TEXT NOT NULL DEFAULT '',
  "detail" TEXT NOT NULL DEFAULT '',
  "user_id" TEXT NOT NULL DEFAULT '',
  "username" TEXT NOT NULL DEFAULT '',
  "ip" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qr_tag_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "qr_tag_events_entry_id_created_at_idx" ON "qr_tag_events" ("entry_id", "created_at");
CREATE INDEX IF NOT EXISTS "qr_tag_events_shop_id_created_at_idx" ON "qr_tag_events" ("shop_id", "created_at");

CREATE TABLE IF NOT EXISTS "qr_revoked_tokens" (
  "token" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "revoked_by" TEXT NOT NULL DEFAULT '',
  "username" TEXT NOT NULL DEFAULT '',
  "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qr_revoked_tokens_pkey" PRIMARY KEY ("token")
);

CREATE INDEX IF NOT EXISTS "qr_revoked_tokens_entry_id_idx" ON "qr_revoked_tokens" ("entry_id");
CREATE INDEX IF NOT EXISTS "qr_revoked_tokens_shop_id_idx" ON "qr_revoked_tokens" ("shop_id");

CREATE TABLE IF NOT EXISTS "qr_scan_attempts" (
  "id" TEXT NOT NULL,
  "token_prefix" TEXT NOT NULL DEFAULT '',
  "shop_id" TEXT NOT NULL DEFAULT '',
  "user_id" TEXT NOT NULL DEFAULT '',
  "username" TEXT NOT NULL DEFAULT '',
  "ip" TEXT NOT NULL DEFAULT '',
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qr_scan_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "qr_scan_attempts_ip_created_at_idx" ON "qr_scan_attempts" ("ip", "created_at");
CREATE INDEX IF NOT EXISTS "qr_scan_attempts_shop_id_created_at_idx" ON "qr_scan_attempts" ("shop_id", "created_at");

ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "qr_show_full_phone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "qr_show_full_address" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "qr_show_order_notes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "qr_pending_expiry_days" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "qr_delivery_expiry_hours" INTEGER NOT NULL DEFAULT 2;
