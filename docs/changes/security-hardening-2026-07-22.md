# Security Hardening Changes - 2026-07-22

Scope: `LaundryPro/node-backend`

## Completed in this pass

### Security headers

Updated `next.config.mjs` to add baseline production security headers for every route:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` blocking camera, microphone, and geolocation
- Baseline `Content-Security-Policy`
- Disabled Next's `X-Powered-By` header with `poweredByHeader: false`

The CSP is intentionally conservative for a live app, but still allows inline styles/scripts needed by the current Next.js app. It can be tightened later after UI testing.

### Build reliability

Removed `next/font/google` usage from `src/app/layout.tsx`.

Reason: production builds were failing when `fonts.googleapis.com` could not be reached:

```text
`next/font` error:
Failed to fetch `Montserrat` from Google Fonts.
```

The app now falls back to the existing CSS font stack and no longer needs Google Fonts network access during build.

### Dependency security updates

Updated direct vulnerable packages:

- `axios`: `^1.7.2` -> `^1.18.1`
- `nodemailer`: `^6.9.14` -> `^9.0.3`

Then ran a non-force `npm audit fix`, which patched additional transitive dependencies without applying breaking major upgrades.

This reduced `npm audit --omit=dev` results from 10 vulnerabilities to 4 vulnerabilities.

### Monthly billing verification and fixes

Checked the customer monthly bill flow:

- Customer detail page filters laundry entries by selected `month/year`.
- Printable invoice route supports `month/year` and uses that month range before calculating totals.
- Bulk bill sending route also filters entries by selected `month/year`.
- Customer balance API uses lifetime billed amount minus lifetime payments, so monthly invoices and full customer balance are separate concepts.

Added defensive validation so invoice routes reject invalid billing periods instead of accidentally falling back to a wider result set:

- `/api/invoices/[customerId]`
- `/api/invoices/[customerId]/email`
- `/api/invoices/bulk-send`

Also escaped customer, shop, and service names in the email invoice HTML so user-entered text cannot be injected into invoice email markup.

Important accounting note: if `ShopProfile.gst_rate` is greater than `0`, the printable customer invoice adds GST on top of the month subtotal, but customer balance and bulk invoice totals currently use stored `laundry_entries.total_amount`, which does not include GST. If GST is enabled for live clients, decide whether GST should be stored in entry totals and balances or only shown on the printable invoice before changing production behavior.

### Simple black-and-white invoices

Simplified customer invoice output:

- Removed the designed/colored invoice layout from the printable monthly invoice.
- Replaced it with a plain black-and-white bill: shop header, invoice details, bill-to details, item table, totals, footer, and signature line.
- Simplified monthly invoice email body to a plain black table layout.
- Simplified bulk-send PDF invoices to a black-and-white PDF layout.
- Simplified bulk-send email body and escaped user-entered customer/shop/UPI text.

### Proposed customer billing type

Added a customer-level `billing_type` field with values:

- `per_order`
- `monthly`

Implemented:

- Prisma schema field on `Customer`.
- Migration SQL: `node-backend/prisma/migrations/20260722000000_add_customer_billing_type/migration.sql`.
- API create/update whitelist and validation.
- Add/edit customer billing type selector.
- Customer list billing badge, quick billing toggle, and billing filter.
- Customer detail billing label.

Bulk monthly bill sending now targets only customers marked as `monthly` and with entries in the selected month. Per-order customers are not included in the monthly bill blast.

The bulk monthly bill modal now also shows how many active per-order customers will be skipped for the selected month.

### Settings page review

Checked the settings page after invoice simplification.

Changes made:

- Added Prisma schema + migration coverage for `shop_profiles.wa_auto_enabled` and `shop_profiles.wa_show_prices`.
- Added `wa_auto_enabled` and `wa_show_prices` to backend settings validation/write handling.
- Updated logo helper text because the new simple black-and-white invoice does not render the logo.

### Superadmin access-control fixes and audit

Fixed two superadmin access-control issues:

- Disabling a client now disables both the shop admin and that shop's staff accounts.
- Removing a client now removes login access for both the shop admin and that shop's staff accounts while leaving shop business data in the database.

Added Phase 1 superadmin foundations:

- Plan document: `docs/superadmin-improvement-plan.md`.
- Migration/schema foundation for `admins.token_version`.
- Migration/schema foundation for `superadmin_action_logs`.
- Backend helper for superadmin action logging.
- Audit logging on create client, edit client, reset password, renew, enable/disable, and remove access.
- `GET /api/admin/action-logs` for superadmin log inspection.
- Superadmin page audit log modal for latest actions.
- New login/setup JWTs include token version.
- `/api/auth/me` refreshes legacy tokens and rejects stale versioned tokens.
- API routes now use DB-backed active/token-version validation through `requireActiveAuth`.
- Password change returns a fresh token and invalidates old sessions.
- Superadmin audit log modal now supports client, action, and date filters.
- Superadmin page now includes a `Check DB` migration status indicator.

GST consistency fix: printable customer invoice now matches ledger totals and no longer adds GST on top of `laundry_entries.total_amount`. This avoids printed invoice totals being higher than balances/bulk-send totals. `gst_rate` remains stored in settings for profile/future tax work, but totals currently use the ledger amount.

### Migration deploy checklist

Added `docs/migration-deploy-checklist.md`.

It lists migration files, deploy order, Superadmin `Check DB` validation, smoke tests, and the remaining audit backlog.

Live DB migration status:

- The three additive migrations were applied to the Neon live DB on 2026-07-22 after user approval to skip backup.
- Prisma initially returned `P3005` because the existing production database was non-empty and had no Prisma migration baseline.
- The migration SQL files were applied with `prisma db execute`, then marked as applied with `prisma migrate resolve --applied`.
- Final `prisma migrate deploy` verification reported no pending migrations.
- Live DB metadata verification confirmed the required columns/table exist.

### Soft delete and restore

Added recovery support for accidental admin deletes:

- Plan document: `docs/soft-delete-restore-plan.md`.
- Migration/schema for soft-delete metadata on customers, orders, payments, expenses, labour work, and labour advances.
- New `data_action_logs` table for admin delete/restore audit.
- Customer delete now soft-deletes the customer plus that customer's orders and payments.
- Entry, payment, expense, labour work, and labour advance delete actions are now soft deletes.
- Normal app lists, invoices, bulk monthly billing, balances, exports, backup export, reports, and superadmin stats exclude soft-deleted rows.
- Superadmin-only deleted data list and restore API.
- Superadmin `Deleted data` modal with filters and restore action.
- Soft-delete migration applied to live Neon DB on 2026-07-22 after user approval to skip backup.

### Login stability fix

Investigated client reports where correct username/password sometimes showed "Invalid username or password" for 2-3 tries and then logged in.

Live login logs showed recent `Wrong password` attempts followed by success for the same client username/IP within seconds, so the most likely cause was accidental mobile/autofill/copy-paste input variation rather than account disable/expiry.

Changes made:

- Backend now trims username before lookup.
- Backend now accepts an accidental leading/trailing whitespace version of the password while still checking the raw password first.
- Frontend now trims username before submit.
- Frontend now blocks duplicate login submits while one request is already running.
- Username/password inputs now disable mobile auto-capitalization, autocorrect, and spellcheck.
- Login page 401 responses no longer trigger the global auth redirect interceptor.
- Login route now logs unexpected server errors to the server console for easier production diagnosis.

### Manual client creation and temporary passwords

Removed the public signup/trial entry flow in favor of superadmin-created client accounts:

- Removed the login page "Start your free trial" link.
- `/trial` and `/complete-signup` now redirect to `/login`.
- Public signup and setup-link APIs now return `410 Gone`.
- Superadmin signup request page/nav/API are disabled.
- New clients created by superadmin receive a temporary password and are flagged with `must_change_password`.
- Superadmin password resets also mark the password as temporary.
- Users with a temporary password are forced to change it before using app APIs.
- The sidebar profile modal shows a blocking password-change form until the password is updated.
- Added migration: `20260722004000_add_must_change_password`.

### Weekly report verification fix

Checked the superadmin weekly report flow and fixed two issues:

- Manual "Send now" now validates the selected shop and uses that shop's real name instead of the superadmin token's shop name.
- Weekly report stats now exclude soft-deleted customers, orders, payments, and expenses, so restored/deleted data does not distort revenue, dues, or expense totals.

## Verification

The following checks passed after changes:

```bash
npx tsc --noEmit
npx prisma validate
npm run build
```

Runtime header check was also verified locally with `next start` and `curl -I` against `/` and `/api/auth/me`. Security headers were present on both page and API responses.

`npm audit --omit=dev` still reports:

- 4 total vulnerabilities
- 1 high
- 3 moderate

Remaining audit items are tied to `next` major upgrade requirements and `exceljs` transitive `uuid`. These should be handled in staging because the suggested fixes require major-version changes or dependency behavior changes.

## Remaining security backlog

These were not changed in this pass because they need staging, DB migration, or broader live-client testing:

1. Move auth tokens from `localStorage` to `HttpOnly Secure SameSite` cookies.
2. Add CSRF protection for cookie-auth write requests.
3. Validate `x-selected-shop` against live shop records for superadmin actions.
4. Add stronger rate limiting beyond login, especially import/export/email routes.
5. Add pagination/limits to large list and export endpoints.
6. Link billing payments to entries, so deleting an entry cannot leave ambiguous payment history.
7. Plan and test a safe Next.js major upgrade to clear remaining Next audit advisories.
8. Review `exceljs` alternatives or upgrade path for remaining transitive advisories.

## Live DB safety note

No seed or destructive schema push was run in this pass. Additive migration SQL was applied to the live Neon database after the user explicitly asked to skip backup.
