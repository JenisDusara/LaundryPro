# LaundryPro — Full Code Audit Report
**Date:** 19 July 2026
**Scope:** node-backend (Next.js 14 + Prisma + PostgreSQL)

---

## Table of Contents
1. [Critical Issues](#critical-issues)
2. [High Severity Issues](#high-severity-issues)
3. [Medium Severity Issues](#medium-severity-issues)
4. [Low Severity Issues](#low-severity-issues)
5. [Priority Fix Plan](#priority-fix-plan)

---

## Critical Issues

### 1. XSS in Email Templates
**File:** `src/lib/email.ts`
**Impact:** Stored XSS in all outgoing emails

All HTML email templates directly interpolate user-controlled strings without HTML escaping:
- Line 63: `${customerName}` in pickup email
- Line 126: `${r.shop_name}`, `${r.owner_name}`, `${r.phone}`, `${r.email}`, `${r.city}` in signup notification
- Line 144: `${shopName}` in complete signup email
- Line 163: `${shopName}`, `${username}` in account activated email

A customer/shop name like `<img src=x onerror="alert(1)">` would execute in email clients.

**Fix:** Create an `esc()` HTML escape utility and wrap all user inputs:
```ts
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
// Then: `<b>${esc(customerName)}</b>`
```

---

### 2. Client-Side JWT Role Spoofing
**Files:** `src/components/Sidebar.tsx:36-39`, `src/app/settings/page.tsx:42`, `src/app/superadmin/page.tsx`, `src/app/signup-requests/page.tsx`

JWT payload is decoded client-side WITHOUT signature verification to extract role:
```ts
const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
return JSON.parse(atob(payload)).role || null;
```

Any user can set `localStorage.setItem("token", "eyJ...{"role":"superadmin"}...")` and see superadmin UI. The backend `/auth/me` endpoint already returns the correct role — use that instead.

**Fix:** Replace all `getTokenRole()` calls with a `/auth/me` API call. Cache the result in context/state.

---

### 3. XSS via Invoice iframe `srcDoc`
**File:** `src/app/customer/[id]/page.tsx:418`

Invoice HTML from the API is set directly on `<iframe srcDoc={invoiceHtml}>` without sanitization. If a service name or customer name contains script tags, it executes in the iframe context.

**Fix:** Sanitize the HTML before setting `srcDoc`, or use a DOMPurify library.

---

### 4. Disabled Users Keep Valid Tokens for 7 Days
**File:** `src/lib/auth.ts`

No token revocation mechanism exists. JWT tokens are valid for 7 days (`expiresIn: "7d"`). When an admin disables a staff account via the admin panel, the staff member's JWT remains valid. Most routes only call `requireAuth(req)` which verifies the JWT signature but does NOT check `is_active` in the database.

The `/api/auth/me` endpoint does check `is_active`, but all other routes skip this check.

**Fix:** Either:
- Add `is_active` check in `requireAuth()` (requires DB query per request — consider caching)
- Or implement a token blocklist (Redis or in-memory set of revoked user IDs)

---

## High Severity Issues

### 5. No Pagination on Any List Endpoint
**Files:** All GET list routes

| Endpoint | Impact |
|----------|--------|
| `GET /api/entries` | All entries + items + customer loaded |
| `GET /api/customers` | All customers loaded |
| `GET /api/payments` | All payments loaded |
| `GET /api/expenses` | All expenses loaded |
| `GET /api/labour/work` | All work records loaded |
| `GET /api/customers/balances` | All customer balances loaded |

For a shop with 10k+ entries, this causes OOM or time-out.

**Fix:** Add `take`/`skip` (or cursor-based) pagination to all list endpoints. Return `{ data, total, page, pageSize }`.

---

### 6. DELETE Entry Orphans Payment Rows
**File:** `src/app/api/entries/[id]/route.ts:126`

When an entry is deleted, `EntryItem` rows are cleaned up via `onDelete: Cascade`, but `Payment` rows are NOT deleted. The payments still count toward the customer's paid total in `balances/route.ts`, making the outstanding balance understate what the customer actually owes.

**Fix:** Delete related payments in a transaction before deleting the entry, or add cascade to the Payment model.

---

### 7. Entry POST Response vs DB Mismatch
**File:** `src/app/api/entries/route.ts:256-266`

When the billing transaction (invoice number + payment creation) fails silently at line 178, the entry is created with `total_amount` set but `amount_paid` stays 0 in DB. However, the response at line 262 returns `amount_paid: paidN` (the client-submitted value). The client shows a different paid amount than what's in the database.

**Fix:** Read the actual `amount_paid` from the DB after the transaction, don't trust the client value.

---

### 8. Import File Size Limit Missing
**File:** `src/app/api/import/route.ts:59`

```ts
Buffer.from(await (file as File).arrayBuffer())
```

The entire uploaded file is loaded into memory with no size check. A 1GB file will OOM the server.

**Fix:** Check file size before reading: `if (file.size > 5 * 1024 * 1024) return 413`

---

### 9. Combined Export Loads ALL Data
**File:** `src/app/api/exports/combined/route.ts:27-39`

7 parallel DB queries, some loading ALL entries and ALL payments for the shop across all time. For a mature shop, this will OOM.

**Fix:** Add date range limits. Force a max export window (e.g., 12 months).

---

### 10. Prisma Client Reconnect Race Condition
**File:** `src/lib/prisma.ts:32-36`

```ts
try { await prisma.$disconnect(); } catch {}
try { await prisma.$connect(); } catch {}
```

Multiple concurrent requests hitting connection errors will all disconnect/reconnect the same shared Prisma instance simultaneously. One request's `$disconnect()` can break another in-flight request.

**Fix:** Use a mutex/lock around reconnection, or let Neon's connection pooling handle this.

---

### 11. Rate Limiting Only on Login
**File:** `src/app/api/auth/login/route.ts`

Rate limiting is DB-based (counts in `login_logs` table). Every login attempt does 1-2 DB queries before bcrypt. An attacker can flood the endpoint causing DB load. No in-memory or middleware-level rate limit exists.

Baaki API routes (entries, customers, payments) pe koi rate limiting nahi hai.

**Fix:** Add in-memory rate limiting middleware (e.g., `upstash/ratelimit` or a simple Map-based limiter).

---

### 12. `x-selected-shop` Header Not Validated
**File:** `src/lib/auth.ts:67-68`

For superadmin, the `x-selected-shop` header is used directly in queries without validating it's a real shop ID. A superadmin (or forged token) can query arbitrary strings as `shop_id`. Trailing spaces, typos, or non-existent shops silently return empty results.

**Fix:** Validate the shop ID against the `shop_profiles` table before using it.

---

## Medium Severity Issues

### 13. Filter Parameter Override Bug
**Files:** `src/app/api/entries/route.ts:15-22`, `src/app/api/expenses/route.ts:12-18`

If `month`+`year` AND `from`+`to` are both provided, only the last assignment wins because they all write to the same `where` field. `from`/`to` overwrites `month`/`year`. The user doesn't know which filter actually applied.

**Fix:** Use `if/else if` to prioritize filters, or return error if conflicting filters are provided.

---

### 14. `parseInt` NaN Not Checked
**Files:** `src/app/api/entries/route.ts:17-18`

`parseInt("abc")` returns `NaN`, and `monthRange(NaN, NaN)` produces garbage date boundaries. The query silently returns wrong results.

**Fix:** Validate parsed values: `if (isNaN(month) || isNaN(year)) return 400`

---

### 15. Staff Username Uniqueness is Global
**File:** `src/app/api/staff/route.ts:39`

```ts
prisma.admin.findUnique({ where: { username } })
```

Username uniqueness is checked across ALL shops. Staff in Shop A can't use a username that exists in Shop B.

**Fix:** Use a compound unique constraint: `@@unique([username, shop_id])` in the Admin model, or query with `shop_id` filter.

---

### 16. Fake Invoice Numbers (Hash Collision)
**File:** `src/app/api/invoices/[customerId]/route.ts:57`

```ts
const invNum = 1000 + (params.customerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000);
```

Invoice number is a deterministic hash of customer ID. Different customers can get the same invoice number (collision). It also changes if the customer ID changes.

**Fix:** Store actual sequential invoice numbers per shop (already partially done in entries via `invoice_no` column).

---

### 17. `wa_auto_enabled` Bypasses Validation
**File:** `src/lib/settings.ts:99-104`

`wa_auto_enabled` is updated via raw SQL, bypassing the EDITABLE/NUMERIC/BOOLEAN validation pipeline. The `catch` block silently swallows ALL errors, not just "column doesn't exist".

**Fix:** Add to EDITABLE set or create a BOOLEAN set. Catch specific error codes only.

---

### 18. Missing Composite Index
**File:** `prisma/schema.prisma:141-142`

Most common query: `WHERE shop_id = ? AND entry_date BETWEEN ? AND ?`. Currently two separate indexes exist. A composite `@@index([shop_id, entry_date])` would be significantly faster.

**Fix:** `npx prisma migrate dev --name add-composite-index`

---

### 19. String Dates Instead of DateTime
**Files:** `prisma/schema.prisma` — `entry_date`, `delivery_date`, `date` (Payment), `date` (Expense)

Dates stored as strings means:
- No DB-level date validation (any string accepted)
- Range queries require string comparison
- No timezone awareness

**Fix:** Migrate to `DateTime` type with proper timezone handling.

---

### 20. `req.json()` No try-catch
**All POST/PUT/PATCH handlers**

If the request body is not valid JSON (e.g., wrong Content-Type), `req.json()` throws an unhandled exception returning 500 with stack trace.

**Fix:** Wrap in try-catch: `let body; try { body = await req.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }`

---

### 21. Token in URL Query String
**File:** `src/lib/auth.ts:45`

```ts
url.searchParams.get("token")
```

Tokens in URLs end up in server access logs, browser history, referrer headers, and proxy logs.

**Fix:** Remove the query string fallback. Only accept `Authorization: Bearer` header.

---

### 22. `THREE_DAYS_MS` Duplicated in 4 Files
**Files:** `src/lib/auth.ts:17`, `src/middleware.ts:3`, `src/app/api/auth/me/route.ts:5`, `src/app/api/auth/login/route.ts:85`

If one is changed, others may not be, causing inconsistent grace-period behavior.

**Fix:** Define once in a shared constants file and import everywhere.

---

### 23. No Audit Trail for Password Changes
**File:** `src/app/api/admin/change-password/route.ts`

Password changes are not logged anywhere. If an account is compromised and the attacker changes the password, there's no trail.

**Fix:** Add a `PasswordChangeLog` model or write to `login_logs` with a `password_changed` status.

---

### 24. Prisma Error Messages Leaked to Client
**File:** `src/app/api/import/route.ts:113`

```ts
errors.push(`${item}: ${e?.message || "failed"}`)
```

Raw Prisma error messages are returned to the client, leaking table names, column names, and constraint details.

**Fix:** Return generic error messages to the client. Log full errors server-side.

---

### 25. `req.json()` Unhandled Parse Error in Entry POST
**File:** `src/app/api/entries/route.ts:73`

Same as #20 but specifically critical here because this is the most-used endpoint.

---

### 26. Middleware Decodes JWT Without Verification
**File:** `src/middleware.ts:6-14`

`decodeJwtPayload` does NOT verify the JWT signature. While routes verify separately, the middleware provides false defense-in-depth. A crafted token with `role: "superadmin"` bypasses subscription checks in middleware.

**Fix:** Either verify in middleware too (expensive — needs secret), or remove the role check from middleware entirely and rely solely on route-level auth.

---

### 27. Login Race Condition in Rate Limiting
**File:** `src/app/api/auth/login/route.ts:48-50`

Two concurrent requests can both read `userFails = 7` (below threshold), then both proceed. With enough concurrency, an attacker can exceed `MAX_USER_FAILS`.

**Fix:** Use database-level atomic operations: `UPDATE login_logs SET count = count + 1 WHERE ... RETURNING count`

---

### 28. Invoice PDF Page Overflow
**File:** `src/lib/invoicePdf.ts:106-120`

After the item loop, the total, UPI, and footer sections are drawn with no `addPage()` check. If items fill the page, these sections render off-page or overlap.

**Fix:** Check `if (doc.y > doc.page.height - 100) doc.addPage()` before drawing totals.

---

### 29. `api.ts` Unbounded Cache
**File:** `src/lib/api.ts:33`

```ts
const cache = new Map<string, { ts: number; res: AxiosResponse }>();
```

No max-size limit. Long read-only sessions accumulate entries indefinitely.

**Fix:** Add `MAX_CACHE_SIZE` and evict oldest entries when exceeded.

---

### 30. `settings.ts` Silent Error Swallowing
**File:** `src/lib/settings.ts:104`

```ts
catch { /* column not present yet */ }
```

Catches ALL errors, not just "column doesn't exist". Permission errors, constraint violations, connection failures are silently eaten.

**Fix:** Check specific error code: `catch (e) { if (e?.code !== "P2022") throw e; }`

---

## Low Severity Issues

### 31. Sidebar Component is 837 Lines
**File:** `src/components/Sidebar.tsx`

Single component handles: desktop sidebar, mobile bottom bar, profile modal, password change form, shop picker, alert notifications, theme switching.

**Fix:** Decompose into smaller components.

### 32. Hardcoded Expense Categories
**File:** `src/app/accounting/page.tsx:27`

Backend allows custom categories but frontend has hardcoded `CATEGORIES` array.

**Fix:** Fetch categories from API or make them configurable.

### 33. `Math.random()` for Item IDs
**File:** `src/app/new-entry/page.tsx:107`

`Math.random().toString()` can theoretically collide. Use `crypto.randomUUID()`.

### 34. No Debounce on Search Inputs
**Multiple files:** customer search, entry search, shop search

Every keystroke triggers re-render and re-filter.

**Fix:** Add 200ms debounce.

### 35. Inline Styles Everywhere
**All page files**

Style objects like `cardStyle`, `label`, `inp` are recreated every render. Use `useMemo` or module-level constants.

### 36. Incomplete TypeScript Types
**File:** `src/types/index.ts`

`Admin` type missing: `role`, `shop_id`, `shop_name`, `is_active`, `plan_type`, `expires_at`, `created_at`. `LaundryEntry` missing `shop_id`.

### 37. `ProtectedLayout.tsx` — Client Auth Only Checks Token Existence
**File:** `src/components/ProtectedLayout.tsx:11-13`

Only checks if token exists in localStorage, not if it's valid.

### 38. Seed Script Hardcoded Password
**File:** `prisma/seed.ts:9`

`"admin123"` hardcoded. Should check `NODE_ENV` before seeding in production.

### 39. No Error Tracking Integration
**File:** `src/app/error.tsx:8`

Errors only logged to `console.error`. No Sentry/LogRocket integration.

### 40. Missing AbortController in useEffect
**File:** `src/components/Sidebar.tsx:123-151`

API calls in useEffect don't use AbortController. Stale responses can call setState after unmount.

### 41. No CSRF Protection on Forms
**Files:** `trial/page.tsx`, `signup-requests/page.tsx`

No CSRF tokens on form submissions.

### 42. WhatsApp Shared Secret Over HTTP
**File:** `src/lib/waAuto.ts:15-17`

If `WA_SERVICE_URL` uses `http://`, the shared secret is sent in plaintext.

### 43. SMS Failures Silently Swallowed
**File:** `src/lib/sms.ts:12,20-22`

SMS sends return success even on failure. Caller has no way to know messages weren't delivered.

### 44. Prisma Overly Broad Error Matching
**File:** `src/lib/prisma.ts:28-31`

`msg.includes("connection")` matches virtually any error containing that word, causing false retries.

### 45. Global CSS Keyframe Leaks
**Files:** `new-entry/page.tsx:191-201`, `accounting/page.tsx:241-254`

`@keyframes fadeUp`/`slideIn` are global and can collide across pages.

### 46. Toggle Switch Not Keyboard Accessible
**File:** `src/app/superadmin/page.tsx:397-403`

Active/inactive toggle is `<div onClick>`, not a `<button>` or `<input type="checkbox">`.

### 47. Missing `useEffect` Dependencies
**Files:** `src/app/labour/page.tsx:62-75`, `src/app/weekly-report-log/page.tsx`

ESLint `react-hooks/exhaustive-deps` suppressed with `eslint-disable` comments.

### 48. Login Activity Hardcoded Limit
**File:** `src/app/login-activity/page.tsx`

Fetches at most 200 records. No pagination UI.

### 49. `calcExpiry` Duplicated
**Files:** `src/app/superadmin/page.tsx:35-41`, `src/app/signup-requests/page.tsx`

Same function copy-pasted. Should be a shared utility.

### 50. Client-Generated Expiry Date on Signup Approval
**File:** `src/app/signup-requests/page.tsx`

Expiry date computed on client. Malicious user could intercept and set arbitrary expiry. Backend should compute.

---

## Priority Fix Plan

### Phase 1 — Critical Security (2-3 days)
| # | Issue | Effort |
|---|-------|--------|
| 1 | XSS in email templates — add HTML escaping | 2 hours |
| 2 | Client-side role spoofing — use /auth/me | 4 hours |
| 3 | Token revocation / is_active check | 1 day |
| 4 | Invoice iframe XSS — sanitize HTML | 2 hours |

### Phase 2 — High Severity Bugs (3-4 days)
| # | Issue | Effort |
|---|-------|--------|
| 5 | Pagination on all list endpoints | 2 days |
| 6 | DELETE entry cascade to payments | 2 hours |
| 7 | Entry POST response vs DB mismatch | 2 hours |
| 8 | Import file size limit | 1 hour |
| 9 | Combined export date limits | 4 hours |
| 10 | Prisma reconnect race condition | 4 hours |
| 11 | Rate limiting middleware | 4 hours |
| 12 | Validate x-selected-shop header | 2 hours |

### Phase 3 — Medium Issues (3-4 days)
| # | Issue | Effort |
|---|-------|--------|
| 13-14 | Filter bug + NaN check | 2 hours |
| 15 | Staff username shop-scoped uniqueness | 2 hours |
| 16 | Sequential invoice numbers | 4 hours |
| 17 | settings.ts validation fix | 2 hours |
| 18 | Composite index migration | 1 hour |
| 19 | String dates → DateTime migration | 4 hours |
| 20 | req.json() try-catch everywhere | 2 hours |
| 21 | Remove token from URL | 1 hour |
| 22 | THREE_DAYS_MS constant | 1 hour |
| 23-30 | Remaining medium fixes | 1 day |

### Phase 4 — Low Severity / Tech Debt (ongoing)
| # | Issue | Effort |
|---|-------|--------|
| 31 | Sidebar decomposition | 1 day |
| 32-50 | All low severity items | 2-3 days |

---

*Report generated by automated code audit on 19 July 2026*
