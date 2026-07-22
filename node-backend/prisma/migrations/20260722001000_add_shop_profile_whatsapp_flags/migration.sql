ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "wa_auto_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "shop_profiles"
ADD COLUMN IF NOT EXISTS "wa_show_prices" BOOLEAN NOT NULL DEFAULT true;
