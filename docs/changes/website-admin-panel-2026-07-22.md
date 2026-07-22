# Website Admin Panel Changes - 2026-07-22

## Scope
- Project: `website`
- Area: marketing website admin panel, lead APIs, review APIs, admin security.
- Live data safety: lead deletion is now soft archive/restore instead of permanent delete.

## Added
- Admin lead search by name, shop, phone, or email.
- Lead filters for status, created date range, due follow-up, and archived records.
- Lead notes and follow-up date fields with inline editing.
- Lead archive/restore workflow.
- Filtered CSV export with notes, follow-up, archive, and email delivery status.
- Admin activity log for lead and review changes.
- Login history tab for admin login attempts.
- Review edit UI in admin panel.
- Email delivery status tracking for public demo leads.
- Public lead submission IP rate limit.
- Security headers and stricter admin cookie/origin checks.

## Changed
- Public lead validation now runs before database writes.
- Public lead email HTML escapes user input.
- Review create/update/delete/publish APIs now require same-origin admin requests and write activity entries.
- Admin session cookie uses `httpOnly`, `sameSite=strict`, and production `secure`.
- `next` package upgraded from `14.2.5` to `14.2.35`.

## Verification
- `./node_modules/.bin/tsc --noEmit` passed.
- `git diff --check` passed.
- `npm run build` passed.
- Local smoke tests passed without live DB mutation:
  - `GET /admin` returned `200`.
  - `GET /api/admin/activity` without auth returned `401`.
  - `GET /api/leads/export` without auth returned `401`.
  - `POST /api/admin/login` with wrong password returned `401`.
  - `POST /api/leads` with invalid phone returned `400`.

## Remaining Risk
- `npm audit --omit=dev` still reports Next/PostCSS advisories. The available automated fix upgrades to `next@16.2.11`, which is a breaking framework upgrade and should be handled as a separate staging task.
- Rotate the Neon database password because a full database URL was shared in chat.
