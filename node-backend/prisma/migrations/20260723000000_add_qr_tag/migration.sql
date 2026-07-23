-- QR garment-tag support on laundry_entries.
-- qr_token: random, globally-unique token backing the public scan URL /t/<qr_token>.
--           Nullable so existing rows stay valid; tokens are backfilled lazily the first
--           time a tag is generated for an order.
-- tag_notes: free-text note printed on the tag and shown on the scan page.
ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "qr_token" TEXT;

ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "tag_notes" TEXT NOT NULL DEFAULT '';

-- tag_mode: which tag layout the shop picked for this order ("order" | "stickers" | "item").
ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "tag_mode" TEXT NOT NULL DEFAULT 'order';

-- tag_status: operational workflow state shown/updated on the scan page.
-- ("collected" | "in_process" | "ready" | "delivered" | "issue"). Superset of delivery_status.
ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "tag_status" TEXT NOT NULL DEFAULT 'collected';

-- delivered_at: set when delivery_status flips to "delivered", cleared when reverted. The scan
-- API uses this to auto-expire a tag 2 hours after delivery.
ALTER TABLE "laundry_entries"
ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3);

-- Per-shop QR privacy/security settings. Defaults are intentionally conservative on printed/
-- scanned data: phone and address are masked unless a shop opts in.
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

-- Backfill for orders that were ALREADY delivered before this feature existed:
--  • tag_status → 'delivered' so the workflow state matches reality.
--  • delivered_at → their last-update time (a past timestamp). Because that is already >2h ago,
--    the scan API treats these tags as expired immediately — which is the desired behaviour for
--    historical orders. (New deliveries get a fresh now() and the full 2h window.)
UPDATE "laundry_entries"
SET tag_status = 'delivered',
    delivered_at = COALESCE(delivered_at, updated_at, created_at)
WHERE delivery_status = 'delivered';

-- Unique index (partial: NULLs are already distinct in Postgres, but keep it explicit).
CREATE UNIQUE INDEX IF NOT EXISTS "laundry_entries_qr_token_key" ON "laundry_entries" ("qr_token");

-- True garment-level tags ("item" tag mode): an EntryItem of quantity N expands into N rows here,
-- one per physical garment, each with its own scan token.
CREATE TABLE IF NOT EXISTS "entry_item_tags" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "entry_item_id" TEXT NOT NULL,
  "seq" INTEGER NOT NULL,
  "qr_token" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "entry_item_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "entry_item_tags_qr_token_key" ON "entry_item_tags" ("qr_token");
CREATE UNIQUE INDEX IF NOT EXISTS "entry_item_tags_entry_item_id_seq_key" ON "entry_item_tags" ("entry_item_id", "seq");
CREATE INDEX IF NOT EXISTS "entry_item_tags_entry_id_idx" ON "entry_item_tags" ("entry_id");
CREATE INDEX IF NOT EXISTS "entry_item_tags_entry_item_id_idx" ON "entry_item_tags" ("entry_item_id");

-- FKs mirror the Prisma relations (cascade delete with the parent entry/item).
DO $$ BEGIN
  ALTER TABLE "entry_item_tags"
    ADD CONSTRAINT "entry_item_tags_entry_id_fkey" FOREIGN KEY ("entry_id")
    REFERENCES "laundry_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "entry_item_tags"
    ADD CONSTRAINT "entry_item_tags_entry_item_id_fkey" FOREIGN KEY ("entry_item_id")
    REFERENCES "entry_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Audit/history for tag scans, status updates, prints/reprints, label edits, and token rotation.
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
