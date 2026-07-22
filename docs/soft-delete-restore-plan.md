# Soft Delete And Restore Plan

Scope: `LaundryPro/node-backend`

Date: 2026-07-22

## Why This Is Needed

If an admin deletes customers, orders, payments, or expense records by mistake, a full database backup restore is risky because two live clients may keep using the app after the mistake. Restoring the whole database can overwrite valid new work.

The safer first recovery layer is:

- Hide deleted records from normal app screens.
- Keep deleted records in the database.
- Log who deleted what.
- Let superadmin review and restore deleted records.

Database backup / Neon point-in-time recovery should still exist for disaster cases, but day-to-day mistakes should use soft delete and restore.

## Phase 1 - Soft Delete Columns

Add these columns to high-risk business tables:

- `deleted_at`
- `deleted_by`
- `deleted_by_username`
- `delete_reason`

Target tables:

- `customers`
- `laundry_entries`
- `payments`
- `expenses`
- `labour_work`
- `labour_advances`

Status:

- Implemented in Prisma schema.
- Migration added: `node-backend/prisma/migrations/20260722003000_add_soft_delete_and_data_audit/migration.sql`.
- Applied to live Neon DB on 2026-07-22 after user approval to skip backup.
- Verified live DB metadata for all soft-delete columns and `data_action_logs`.

Notes:

- `entry_items` do not need separate soft delete in Phase 1 because they stay under `laundry_entries`.
- `services` and `labours` already use active/inactive behavior, so they are lower risk.
- Staff/client login removal is handled separately through admin access-control hardening.

## Phase 2 - Admin Data Audit

Add `data_action_logs` table.

Track:

- actor admin ID
- actor username
- actor role
- shop ID
- action name
- entity type
- entity ID
- entity label
- metadata
- IP address
- timestamp

Actions to log:

- customer soft delete
- customer restore
- entry soft delete
- entry restore
- payment soft delete
- payment restore
- expense soft delete
- expense restore
- labour work soft delete
- labour work restore
- labour advance soft delete
- labour advance restore

Status:

- Implemented `data_action_logs` table.
- Added `src/lib/dataAudit.ts`.
- Delete and restore flows write best-effort audit records.

## Phase 3 - Replace Hard Deletes

Convert risky delete endpoints:

- `DELETE /api/customers/[id]`
- `DELETE /api/entries/[id]`
- `DELETE /api/payments/[id]`
- `DELETE /api/expenses/[id]`
- `DELETE /api/labour/work/[id]`
- `DELETE /api/labour/advance/[id]`

Behavior:

- Normal users see the same `Deleted` response.
- Internally, rows get `deleted_at = now()`.
- Customer delete cascades as soft delete to that customer's entries and payments.
- Restore can bring the customer, entries, and payments back.

Status:

- Implemented for customers, entries, payments, expenses, labour work, and labour advances.
- Customer delete now soft-deletes the customer plus that customer's entries and payments.
- Customer re-add with the same phone restores the previously deleted customer graph instead of failing on the unique phone constraint.

## Phase 4 - Hide Deleted Data

Normal app APIs should exclude rows where `deleted_at IS NOT NULL`.

Apply to:

- customer list/detail/search
- entries list/detail/month filters
- payments list/balance
- expenses list/reports
- invoices and bulk monthly billing
- exports and shop backup exports
- labour work/advance lists

Status:

- Implemented for the normal app APIs, invoices, bulk monthly billing, balances, exports, shop backup export, reports, and superadmin client stats.

## Phase 5 - Superadmin Restore

Add superadmin-only APIs:

- `GET /api/admin/deleted-records`
- `POST /api/admin/deleted-records/restore`

Filters:

- shop
- entity type
- date range
- search label

Restore behavior:

- Restore one deleted entity by type and ID.
- Restoring a customer also restores that customer's deleted entries and payments by default.
- Every restore writes a `data_action_logs` record.

Status:

- Implemented `GET /api/admin/deleted-records`.
- Implemented `POST /api/admin/deleted-records/restore`.

## Phase 6 - UI

Add a Super Admin control:

- `Deleted data` button/modal.
- Show deleted records with type, shop, label, deleted by, deleted time.
- Filters for shop/type/date/search.
- Restore button with confirmation.

Status:

- Implemented Superadmin `Deleted data` modal with shop/type/date/search filters and restore action.

## What This Does Not Replace

Soft delete does not replace full DB backup.

Still needed for disaster recovery:

- database provider backup / PITR
- deployment rollback plan
- export backups

Soft delete is for admin mistakes. Full DB backup is for infrastructure failure, migration mistake, or corruption.

## Live DB Safety

All Phase 1 migration changes are additive nullable/default columns and a new audit table.

No existing business rows should be deleted by this implementation.
