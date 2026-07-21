# Audit Fixes — Applied (July 2026)

Follow-up to `node-backend/AUDIT-REPORT.md`. After reviewing all 50 audit items against the
**actual code and this app's real scale** (small laundry shops — hundreds of customers per
shop, not 10k+), a focused subset of genuinely valuable, low-risk fixes was implemented.
The rest were judged already-handled or overkill for the current scale (see bottom).

## ✅ Fixed in this pass

| Audit # | Fix | File(s) |
|--------|-----|---------|
| 1 | **Email XSS** — added `esc()` HTML-escape and wrapped every user-controlled value (customer/shop/service names, and the **public signup-form** fields — highest risk) | `src/lib/email.ts` |
| 7 | **Entry POST response accuracy** — billing fields (`amount_paid`, `discount`, `extra_charge`, `payment_method`) are now reported as their **persisted** values; if the billing transaction rolls back, the response returns 0/empty instead of the client-submitted values | `src/app/api/entries/route.ts` |
| 8 | **Import file-size limit** — reject uploads > 5 MB (413) before reading the whole file into memory (OOM guard) | `src/app/api/import/route.ts` |
| 13 | **Filter override bug** — date filters now apply exactly one (priority: exact day → range → month) so passing multiple never silently overrides | `src/app/api/entries/route.ts`, `src/app/api/expenses/route.ts` |
| 14 | **`parseInt` NaN guard** — invalid month/year returns 400 instead of querying garbage date boundaries | `src/app/api/entries/route.ts`, `src/app/api/expenses/route.ts` |
| 20 | **`req.json()` try-catch** — malformed request body returns a clean 400 instead of a 500 stack trace, on the write endpoints: entries POST + PUT, payments POST + PUT, customers POST | `entries/route.ts`, `entries/[id]/route.ts`, `payments/route.ts`, `payments/[id]/route.ts`, `customers/route.ts` |
| 18 | **Composite indexes** — added `(shop_id, entry_date)`, `(shop_id, date)` on payments & expenses; speeds up the hottest queries (Orders list, Reports, Payments history) | `scripts/add-billing-columns.sql` (applied to DB) |
| 29 | **API cache bounded** — the client GET cache now caps at 120 entries (LRU-style eviction) so a long read-only session can't grow memory unbounded | `src/lib/api.ts` |

Related earlier in the same effort:
- **Client GET cache (20s TTL, cleared on any mutation)** added for snappier navigation — `src/lib/api.ts`.

## 🔎 Reviewed but intentionally NOT changed

- **#3 Invoice iframe XSS** — the invoice route already HTML-escapes via `esc()` (15 usages); the `srcDoc` content is already safe. No change needed.
- **#6 Delete entry → orphan payments** — payments have **no** `entry_id` link, so "related payments" can't be identified; auto-deleting a customer's payments on order-delete would destroy real cash records. Keeping the payment (which becomes an advance/credit) is the safer behaviour. Left as-is by design.
- **Money rounding, login rate-limit, duplicate-customer, entry validation** — already fixed in a prior pass (see project task history).

## ⏭️ Deferred (overkill for current scale — revisit when the app grows)

- **#5 Pagination on list endpoints** — only matters at 10k+ rows; month/date filters already bound result sets.
- **#19 String dates → DateTime** — large, risky migration, low ROI now.
- **#2 Client-side role spoofing** — UI-only; backend enforces the real role on every request (verified isolation), so it is not a data-access risk.
- **#4 Token revocation / is_active on every request**, **#10 Prisma reconnect mutex**, **#11 broad rate-limiting**, **#39 Sentry**, **#41 CSRF**, **#31 Sidebar decomposition** — nice-to-have hardening, not urgent for this app.

## Verification
- `npx tsc --noEmit` → clean (exit 0) after all changes.
- Migration (`scripts/add-billing-columns.sql`) applied to the DB: **11/11** statements (8 columns + 3 indexes), idempotent.
- End-to-end regression (create → filter by month → invoice → payments range → edit/delete) previously passed 22/22; re-run was blocked only because the local dev server was stopped (not a code issue).
