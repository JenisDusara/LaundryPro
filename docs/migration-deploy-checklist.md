# Migration Deploy Checklist - LaundryPro

Scope: `LaundryPro/node-backend`

Date: 2026-07-22

## Rule For Live Clients

Do not deploy code that depends on a new column/table until the matching Prisma migration has been applied to the live database.

Before live deploy:

1. Take a database backup or confirm provider point-in-time recovery.
2. Deploy only during a low-traffic window.
3. Run migrations first.
4. Start the app after migrations pass.
5. Open Super Admin and use `Check DB`.
6. Confirm customer create/edit, monthly bill preview, bulk bill send screen, settings save, and superadmin login still work.

## Pending Migration Files

These migrations are part of this change set.

- `node-backend/prisma/migrations/20260722000000_add_customer_billing_type/migration.sql`
- `node-backend/prisma/migrations/20260722001000_add_shop_profile_whatsapp_flags/migration.sql`
- `node-backend/prisma/migrations/20260722002000_add_superadmin_audit_and_token_version/migration.sql`
- `node-backend/prisma/migrations/20260722003000_add_soft_delete_and_data_audit/migration.sql`

Live DB status on 2026-07-22:

- Applied manually with `prisma db execute` because the existing production database was non-empty and had no Prisma migration baseline.
- Marked as applied in Prisma migration history with `prisma migrate resolve --applied`.
- Verified with `prisma migrate deploy`: no pending migrations.
- Verified required live DB columns/table via metadata query.

Additional live DB status on 2026-07-22:

- `20260722003000_add_soft_delete_and_data_audit` was applied with `prisma migrate deploy`.
- Verified soft-delete columns on `customers`, `laundry_entries`, `payments`, `expenses`, `labour_work`, and `labour_advances`.
- Verified `data_action_logs` table exists.

## Superadmin DB Check

The app now includes:

- `GET /api/admin/migration-status`
- Superadmin `Check DB` button

This verifies required schema objects:

- `customers.billing_type`
- `shop_profiles.wa_auto_enabled`
- `shop_profiles.wa_show_prices`
- `admins.token_version`
- `superadmin_action_logs`
- soft-delete columns for customers, entries, payments, expenses, labour work, and labour advances
- `data_action_logs`

If any check fails, stop rollout and apply the missing migration before using the new features.

## Verification Commands

Run from `node-backend`:

```bash
npx prisma validate
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

## Current Known Audit Backlog

`npm audit --omit=dev` still reports advisories that require staging work:

- Next.js major upgrade path.
- `exceljs` transitive dependency review.

Do not force these upgrades directly on production without a staging build and smoke test.
