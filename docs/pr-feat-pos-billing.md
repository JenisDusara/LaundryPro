# PR: feat/pos-billing — Billing, Filters, Reports & UX

Master plan/summary for everything in this PR (branch `feat/pos-billing`, off `main`).
Core stays **billing + data** for the all-India laundry market; each item below is
additive and safe. Status: **built + verified (`tsc` clean, key paths live-tested),
awaiting owner test → then commit/merge.**

---

## 1. Service catalog — Category
- `Service.category` (MEN / WOMEN / KIDS / HOUSEHOLD / INSTITUTIONAL / OTHERS).
- Services page: category selector in add/edit + a chip on items.
- Files: `prisma/schema.prisma`, `api/services/route.ts`, `api/services/[id]/route.ts`, `services/page.tsx`, `types/index.ts`.

## 2. Billing at the counter — Discount / Charges / Payment
- New Entry: **Discount** + **Extra charge** inputs → live **Grand total**.
- **Payment at billing:** Cash / UPI / Online / Pay-later → records a `Payment` row
  (udhaar/balance stays correct). Live balance / change readout.
- `laundry_entries.total_amount` now stores the grand total (items − discount + charge),
  so all existing statement/accounting math keeps working unchanged.
- Entries list shows per-order Paid/Due chip + discount/charge line.
- WhatsApp auto-bill includes the amount breakdown + paid/balance.
- Files: `api/entries/route.ts`, `new-entry/page.tsx`, `entries/page.tsx`, `types`.

## 3. Dropped by choice
- POS grid rebuild of New Entry (kept the existing service selector).
- Running invoice numbers + invoice-wise report. (`invoice_no` column exists, unused.)

## 4. Friendly empty states
- Reusable `components/EmptyState.tsx` (laundry-basket illustration, light+dark)
  across Entries, Customers, Deliveries, Accounting, Labour, Reports, Dashboard,
  Staff, Signup-requests, Superadmin.

## 6. Order pipeline — REMOVED (owner didn't want it)
- The Booked → Ready → Out → Delivered pipeline was built, then **removed**. The pills,
  `api/entries/[id]/order-status`, and `order_status` in code are gone. The
  `order_status` column stays in DB (unused). Entries status filter now = Pending/Delivered.

## 7. Filters — MyUniclean-style, collapsible (all list screens)
- `components/Filters.tsx` → a **"Filter" button** that opens a panel: dropdowns +
  Start/End date (+ Today / 7-days / This-month presets) + separate Name/Phone search +
  Search & Reset. Panel is hidden until the button is clicked; a badge shows active count.
- **Entries:** Status + Payment + date range + name/phone. (`api/entries` takes `from`/`to`.)
- **Customers:** Society + Balance(Udhaar) + name/phone.
- **Deliveries:** Status + Society + date range + name/phone.
- **Reports:** date range.

## 8. Reports — Collection report + Export-all
- **Collection tab:** Billed vs Collected vs **Outstanding (udhaar)** + Cash/UPI/Card/
  Other breakdown. (`api/payments` takes `from`/`to`.)
- **Export-all:** Reports "Export Excel" writes 6 sheets — Summary, Entries,
  Customers+Udhaar, Payments, Expenses, Labour. (`api/exports/combined` takes `from`/`to`.)

## 9. Bulk Import (superadmin only)
- **`/import`** page + `api/import`: upload Excel to bulk-add **Customers** and
  **Garment prices** into the selected shop (sample template download; duplicate /
  incomplete rows skipped). Nav entry shows for superadmin only.

## 10. UPI pay-page + QR — REMOVED (owner didn't want it)
- Built, then **removed** at the owner's request: the `/pay/[entry]` page, `api/pay`,
  the WhatsApp bill pay-link, and the `qrcode` dependency are all gone.
- The shop's **UPI ID field in Settings stays** (it predates this PR and is used on
  invoices) — remove separately only if the owner asks.

## 11. Dashboard — REMOVED (reverted to original)
- The Total Udhaar card + pipeline row were **removed**; Dashboard is back to the
  original (revenue cards, overdue, stats, quick actions, collections, today's pickups).

## 12. Grouped sidebar — REMOVED (reverted to flat)
- The Daily/People/Money grouping was **removed**; sidebar is back to the flat list.
  (Only the superadmin **Import** entry is kept for the Bulk Import feature.)

---

## Data model (all additive, safe)
- `services.category`
- `laundry_entries`: `discount`, `extra_charge`, `amount_paid`, `payment_method`,
  `order_status` (+ unused `invoice_no`)
- Added via `ADD COLUMN / CREATE TABLE IF NOT EXISTS`; read/written via raw SQL so
  nothing breaks before the Prisma client is regenerated.

## New pages / components / APIs
- Pages: `/import`
- Components: `EmptyState.tsx`, `Filters.tsx`
- APIs: `import`; extended `entries`, `payments`, `exports/combined`.

## Verification
- `npx tsc --noEmit` — clean across the branch.
- Live-DB tested: all new columns present; import + collection queries run.
- Full in-app / phone testing: **pending owner test** before merge.

## Deploy notes
- Only merged-to-`main` deploys to Vercel production.
- Reference docs: `docs/pos-billing-upgrade.md`, `docs/competitor-review-myuniclean.md`.
