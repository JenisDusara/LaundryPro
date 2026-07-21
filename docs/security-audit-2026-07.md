# LaundryPro — Security Audit (July 2026)

Security-focused review of `node-backend` (Next.js 14 + Prisma + Neon Postgres on Vercel),
reflecting fixes already applied this cycle. Status key: ✅ solid · ⚠️ gap to close · 🔧 needs action.

---

## 1. Authentication & Sessions
| Item | Status | Notes |
|---|---|---|
| Password storage | ✅ | bcrypt-hashed; plaintext never stored |
| Login token | ✅ | JWT signed with `SECRET_KEY` (set in prod); can't be forged |
| Token in URL query fallback | ⚠️ | `auth.ts` still accepts `?token=` — ends up in logs/history. Remove if unused (audit #21) |
| Disabled user still valid 7 days | ⚠️ | Only `/auth/me` checks `is_active`; other routes don't. Add `is_active` check in `requireAuth` (audit #4) |
| Middleware decodes JWT unverified | ⚠️ | `middleware.ts` — only for read-only grace enforcement; real auth is verified per-route. Defense-in-depth only; acceptable but noted (audit #26) |
| 2FA for owners | 🔧 future | Not present; consider for owner accounts later |

## 2. Authorization & Multi-tenant Isolation  ✅ (strongest area)
| Item | Status | Notes |
|---|---|---|
| Per-shop `shop_id` scoping | ✅ | Every read/write scoped via `shopFilter`; header ignored for non-superadmin |
| Verified end-to-end | ✅ | Live cross-tenant test **10/10** — shop A cannot read/edit/delete shop B (entries, payments, invoices, customers) |
| Role gating | ✅ | staff blocked from accounting/reports/expenses (`denyStaff`) |
| Backup is single-shop | ✅ | `admin/backup` refuses to run without a selected shop — never mixes shops |
| Client-side role (UI only) | ⚠️ | Sidebar reads role from unverified token for menu display; backend enforces real role on every request → not a data-access risk (audit #2) |
| `x-selected-shop` not validated | ⚠️ low | Superadmin-only; a bad value returns empty, not another shop's data (audit #12) |

## 3. Injection & XSS
| Item | Status | Notes |
|---|---|---|
| SQL injection | ✅ | Prisma parameterizes; raw SQL uses bound params ($1,$2) everywhere |
| Email HTML XSS | ✅ fixed | `esc()` now wraps all user inputs incl. public signup-form fields |
| Invoice HTML | ✅ | Invoice route escapes via `esc()` (15 uses); iframe `srcDoc` content is safe |
| Client `dangerouslySetInnerHTML`/`eval` | ✅ | None found |
| Malformed request body | ✅ fixed | `req.json()` guarded on write endpoints → clean 400, no 500 stack trace |

## 4. Secrets & Credentials
| Item | Status | Notes |
|---|---|---|
| `.env` in git | ✅ | gitignored + not tracked |
| Hardcoded secrets in source | ✅ | None (cron uses `x-cron-secret` header; seed password only in seed script) |
| DB password exposed in chat | 🔧 **action** | `DATABASE_URL` was pasted earlier → **rotate the Neon password**, update Vercel + `.env` |
| `SECRET_KEY` in prod | ✅ | Set (Vercel, Production) |
| Prisma errors leaked to client | ⚠️ | `import/route.ts` returns raw error messages — make generic (audit #24) |

## 5. Encryption
| Item | Status | Notes |
|---|---|---|
| In transit (app) | ✅ | HTTPS (Vercel default) |
| In transit (DB) | ✅ | `sslmode=require` in connection string |
| At rest (DB) | ✅ | Neon encrypts storage (AES-256) automatically |
| Security headers (HSTS/CSP/X-Frame) | ⚠️ | Not set — add via `next.config`/middleware (cheap hardening) |

## 6. Rate limiting / brute force
| Item | Status | Notes |
|---|---|---|
| Login rate limit | ✅ | Per-user + per-IP fail counting exists |
| Login count race | ⚠️ low | Concurrent requests can slightly exceed threshold (audit #27) |
| Other endpoints | 🔧 future | No global rate limit; low urgency at current scale |

## 7. Data backup & integrity  🔧 (most important gap)
| Item | Status | Notes |
|---|---|---|
| Manual per-shop export | ✅ | `admin/backup` → Excel |
| Automatic DB backup / restore | 🔧 **action** | **Enable/verify Neon Point-in-Time Restore (PITR)** — the real safety net against accidental delete/corruption |
| Money integrity | ✅ | Amounts rounded consistently; billing + payment in one transaction |
| Delete-entry vs payments | ✅ by design | Payments kept (become advance) — safer than auto-deleting cash records |

## 8. Logging & audit trail
| Item | Status | Notes |
|---|---|---|
| Login activity log | ✅ | `login_logs` |
| Password-change / delete audit | ⚠️ | Not logged — consider adding for traceability (audit #23) |

## 9. PII handling
| Item | Status | Notes |
|---|---|---|
| Customer PII (phone/address) | ✅ | Shop-scoped; not placed in URLs |
| PII in logs | ⚠️ | Some `console.error` may include data — review before adding external logging |

---

## Priority Action Plan

### 🔧 You (Neon / Vercel dashboard — do first)
1. **Enable/verify Neon PITR** (backup safety net) — highest priority.
2. **Rotate the leaked `DATABASE_URL` password** → update Vercel env + local `.env`.
3. Confirm `SECRET_KEY` stays set in Production (already ✅).

### 🖥️ Code (I can implement)
4. `is_active` check in `requireAuth` (revoke disabled users immediately).
5. Security headers (HSTS, X-Frame-Options, basic CSP).
6. Remove `?token=` URL fallback; generic import error messages.
7. (Optional) automatic weekly all-shop backup job; broader rate limiting.

### ✅ Already solid — no action
Multi-tenant isolation (10/10 verified), password hashing, SQL-injection safety, email/invoice XSS, transport + at-rest encryption, `.env` secrecy.

---

*Overall: the app's core data-security (isolation, auth, encryption, injection) is in good shape. The main real risks are operational — backups and the leaked DB credential — plus a few cheap hardening wins.*
