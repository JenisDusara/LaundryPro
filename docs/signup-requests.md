# Signup Requests — Plan & Implementation

Approval-gated "Start free trial" flow: a lead submits a request, superadmin
reviews it, and only on approval does an actual shop account get created —
and even then, the customer chooses their own username/password via a secure
link rather than being emailed plaintext credentials. No self-serve instant
signup, no phone OTP.

## Goal

The marketing site offers a free trial. Instead of instantly creating a login
(spam risk, no plan/shop_id control), a request goes into a review queue.
Superadmin sees it on its own page (`/signup-requests`, in the sidebar next
to Clients / Weekly Reports / Login Activity), and either:
- **Accept** — a small modal asks only for Shop Name / Shop ID / plan
  (Trial 7d / Monthly / Yearly). Submitting creates the Admin account with a
  placeholder username and an unusable random password, then emails the lead
  a "set up your account" link.
- **Reject** — marks the request rejected, no account created.

Every request (pending, approved, rejected) stays in the database as a lead
record — meant to double as a marketing contact list later.

## How it works

```
Public "Start free trial" form (node-backend /trial page)
        │  POST (no auth)
        ▼
/api/signup-requests ──► SignupRequest row ("pending")
        │                  rate-limited by IP (5/hour, same pattern as login)
        │
        └──► notifies ADMIN_NOTIFY_EMAIL (or EMAIL_USER) so a human reviews it

Superadmin → /signup-requests page
        │
        ├── Reject ──► PATCH /api/admin/signup-requests/[id] (status: "rejected")
        │
        └── Accept ──► POST /api/admin/shops { shop_name, shop_id, plan_type,
                        expires_at, signup_request_id }
                        │
                        ├── creates Admin: placeholder username
                        │   (pending_<random>), random unusable password,
                        │   setup_token + 3-day expiry
                        ├── upserts ShopProfile.email/phone from the request
                        └── marks SignupRequest "approved"
                        │
                        └──► emails the lead a link:
                             /complete-signup?token=...

Lead clicks the link
        │
        ▼
/complete-signup page ──► GET /api/auth/complete-signup?token=  (validates,
        │                  shows shop name or "link invalid/expired")
        │
        └── submits chosen username + password
                        │
                        ▼
             POST /api/auth/complete-signup { token, username, password }
                        │
                        ├── checks token not expired, username not taken
                        ├── sets real username/password_hash, clears setup_token
                        └── returns a JWT — the page logs them straight into
                            /dashboard, no separate login step needed
```

## Data model (`prisma/schema.prisma`)

```prisma
model SignupRequest {
  id          String    @id @default(uuid())
  shop_name   String
  owner_name  String
  phone       String
  email       String
  city        String    @default("")
  status      String    @default("pending") // "pending" | "approved" | "rejected"
  ip          String    @default("")
  created_at  DateTime  @default(now())
  reviewed_at DateTime?
}

model Admin {
  // ...existing fields...
  setup_token         String?   @unique // pending account-setup link
  setup_token_expires DateTime?
}
```

## Key files

| File | Purpose |
|---|---|
| `src/app/trial/page.tsx` | Public form (shop name, owner name, phone, email, city) |
| `src/app/api/signup-requests/route.ts` | Public `POST` — validates (10-digit phone, email format), rate-limits by IP, creates a `pending` row, emails the business a notification |
| `src/app/signup-requests/page.tsx` | Superadmin-only page — pending list, Accept modal (shop name/ID/plan only), Reject confirm, history |
| `src/app/api/admin/signup-requests/route.ts` | Superadmin-only `GET` — list all requests |
| `src/app/api/admin/signup-requests/[id]/route.ts` | Superadmin-only `PATCH` — reject only |
| `src/app/api/admin/shops/route.ts` | Existing "create shop" endpoint, extended: when `signup_request_id` is present, generates placeholder credentials + setup token instead of requiring username/password from the request body |
| `src/app/complete-signup/page.tsx` | Public — lead lands here from the email, chooses username/password |
| `src/app/api/auth/complete-signup/route.ts` | Public `GET` (validate token) / `POST` (set credentials, return a login JWT) |
| `src/components/Sidebar.tsx` | Superadmin nav: Clients / Signup Requests (pending-count badge) / Weekly Reports / Login Activity |

## Emails sent

All emails now show the LaundryPro logo (`src/lib/logo.ts`, embedded as a
`cid:` inline attachment in every `sendEmail()` call — not an external image
URL, so it always renders regardless of hosting).

- **New request → notify the business.** `newSignupRequestEmailHtml` to
  `ADMIN_NOTIFY_EMAIL` (falls back to `EMAIL_USER`).
- **Approved → invite the lead to set up their account.**
  `completeSignupEmailHtml` to the lead's email — contains only a setup link,
  no credentials in plaintext. Link expires in 3 days
  (`SETUP_LINK_VALID_DAYS` in `src/app/api/admin/shops/route.ts`).
- All sends are best-effort (`sendEmail(...).catch(...)`) — a failed email
  never blocks request/account creation.
- Sending requires a valid Gmail **App Password** in `EMAIL_USER`/`EMAIL_PASS`
  (regular Gmail passwords don't work over SMTP once 2-Step Verification is
  on — generate one at myaccount.google.com/apppasswords).

## Trial plan

Accepting a request defaults to a **7-day trial** (`calcExpiry("trial")` in
`src/app/signup-requests/page.tsx`) instead of forcing an immediate
Monthly/Yearly choice — matches the "free trial" framing on the signup form.

## Why no phone OTP

Real SMS OTP requires a paid SMS gateway — there's no free/open-source way to
send SMS. Decision: rely on the manual approval step instead of OTP; superadmin
already vets every request before creating the account.

## Not yet built

- Bulk marketing email to leads (the `SignupRequest` table is the intended
  data source for this).
- The marketing site's own trial form (lives in the separate `website/`
  project) — this covers only the node-backend side it should POST to.
