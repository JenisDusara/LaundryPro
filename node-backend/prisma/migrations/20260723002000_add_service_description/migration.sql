-- Optional free-text description for a service (shown in the catalogue form, useful for
-- "OTHERS" category items where the name alone doesn't explain what the service is).
-- Idempotent so it is safe to run against an environment where the column already exists.
ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "description" TEXT;
