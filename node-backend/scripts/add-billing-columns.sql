-- ─────────────────────────────────────────────────────────────────────────────
-- LaundryPro — billing columns migration
--
-- These columns are used via raw SQL in the app (not in schema.prisma), so a plain
-- `prisma db push` does NOT create them. Run this ONCE on each database (prod = Neon)
-- before deploying the POS-billing / order-detail features.
--
-- Safe to re-run: every statement is `IF NOT EXISTS`, so it never errors or overwrites.
-- How to run:
--   • Neon console → SQL Editor → paste this whole file → Run
--   • or:  psql "$DATABASE_URL" -f scripts/add-billing-columns.sql
--   • or:  node scripts/migrate-billing-columns.cjs   (uses DATABASE_URL from env)
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-shop running bill number (starts at 1), billing fields, and delivery date.
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS invoice_no     INTEGER;
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS discount       NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS extra_charge   NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS amount_paid    NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '';
ALTER TABLE laundry_entries ADD COLUMN IF NOT EXISTS delivery_date  TEXT;

-- Partial-delivery count per item.
ALTER TABLE entry_items ADD COLUMN IF NOT EXISTS delivered_qty INTEGER NOT NULL DEFAULT 0;

-- POS catalog category filter on services.
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
