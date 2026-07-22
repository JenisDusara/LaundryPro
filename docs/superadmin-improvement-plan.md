# Superadmin Improvement Plan

Scope: `LaundryPro/node-backend`

Date: 2026-07-22

## Current State

The current superadmin page supports core client management:

- Create client/shop admin.
- Edit shop name, shop ID, username, owner name, and password.
- Renew monthly/yearly plan.
- Enable/disable client access.
- Remove client login access.
- Search clients.
- View client stats, staff count, monthly revenue, last activity, and expiry alerts.
- Review signup requests through the separate signup request page.

## Priority 1 - Access Control

Goal: when superadmin disables, removes, or changes sensitive account data, access should stop predictably.

Planned work:

- Add a token/session version on admin accounts.
- Include token version in newly issued JWTs.
- Bump token version on disable, remove, password reset, and other sensitive account actions.
- Add DB-backed validation for active sessions.
- Keep deleted/disabled client business data in place unless superadmin explicitly chooses data deletion.

Status:

- Implemented. Token-version migration/schema foundation has been added.
- New login/setup tokens now carry token version.
- `/api/auth/me` refreshes legacy tokens and rejects stale versioned tokens.
- API routes now use DB-backed active/token-version validation through `requireActiveAuth`.
- Password change returns a fresh JWT and invalidates old sessions.

## Priority 2 - Audit Log

Goal: every superadmin action should leave a record.

Planned work:

- Add a `superadmin_action_logs` table.
- Log create client, edit client, renew plan, enable/disable client, remove access, approve/reject signup, and password reset.
- Store actor ID/username, target shop/admin, action name, metadata, IP, and timestamp.
- Later add a superadmin UI tab to search/filter logs.

Status:

- Implemented. Backend table/helper logging has been added.
- `GET /api/admin/action-logs` has been added for superadmin log inspection.
- Create client, approve signup, reject signup, edit client, password reset, renew, enable/disable, and remove access now write audit records.
- Superadmin page has an audit log modal with client, action, and date filters.

## Priority 3 - Subscription History

Goal: plan and renewal history should be visible instead of only the latest expiry date.

Planned work:

- Add subscription history table or action-log based renewal history.
- Show previous renewals, plan type, old expiry, new expiry, and actor.
- Add optional payment note/reference for manual tracking.

Status:

- Partially covered by action logs for renewals. A dedicated renewal/payment history UI is still pending.

## Priority 4 - Client Lifecycle

Goal: reduce accidental destructive actions.

Planned work:

- Replace hard login deletion with archive/soft-remove semantics where practical.
- Add explicit restore client access.
- Add stronger confirmation for removing access.
- Keep business data separate from login access.

## Priority 5 - Operational Dashboard

Goal: superadmin should quickly identify inactive, expiring, or unhealthy clients.

Planned work:

- Add filters for active, disabled, expired, expiring soon, idle shops, and high usage.
- Add per-shop usage drill-down: customers, entries, revenue, payments, staff, last login.
- Add export for client list and renewal follow-up list.
- Show database migration health so deploy mistakes are visible from Super Admin.

Status:

- Migration status API and Superadmin `Check DB` indicator have been added.

## Priority 6 - Security Hardening

Goal: make superadmin safer because it controls every client.

Planned work:

- Move JWT from `localStorage` to `HttpOnly Secure SameSite` cookies.
- Add CSRF protection after cookie auth.
- Add 2FA for superadmin login.
- Add stricter rate limits for superadmin endpoints.
- Add sensitive action re-authentication for password reset/remove access.

## Live DB Safety

All schema changes should be committed as migration files first. Do not apply migrations to the live DB without an approved deploy window and backup.
