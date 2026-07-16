# Competitor Review — MyUniclean (vs LaundryPro)

A review of **app.myuniclean.com** (a similar laundry-management SaaS) and a plan
for what LaundryPro should add, what design to change, and — importantly — what
NOT to copy.

> Based on the shop dashboard + booking flow (the app is a SPA on a generic admin
> template; some sub-pages weren't deep-dived). Feature list may be slightly
> incomplete — reports/settings internals not fully explored.

## What MyUniclean has (observed)

**Dashboard is order-pipeline centric:**
- KPI tiles: **Collection Amount**, **Order Requests**, **Pending Orders**
- **Booking / Delivery / Delivered** counts, each with a date
- **Upcoming Deliveries** list
- **Unassigned Pickups** and **Unassigned Deliveries** lists

**Booking flow:** "Search Customer" → search by **Mobile / Name / Invoice No**, or
**Add Customer** → create an order.

**Notable features:**
1. **Order Requests** — customer-initiated online order requests (implies a
   customer-facing ordering channel + "Register Now" on login). *(LaundryPro is
   shop-only.)*
2. **Send WhatsApp Link** for collection — a payment/collection link over
   WhatsApp. *(LaundryPro sends reminders/bills, not a pay-link.)*
3. **Invoice number** as a first-class identifier (search by invoice no).
5. Reports, Settings, Notifications; theme (dark/RTL/mini-sidebar).

**Design/tech:** built on an off-the-shelf admin template (Material/Spike-style).
The template's demo menu (Chat, Todo, Invoice App, Calendar, Courses, Employee,
Tickets, Pricing…) is **still present** — clutter that isn't part of a laundry
product. Icon-only sidebar; SPA.

## Where LaundryPro is stronger (keep — don't lose these)

- **Udhaar (credit) tracking + full customer statement/ledger** — clear, strong.
- **Accounting** (income/expense, day-wise) + **Labour** (wages/advances).
- **WhatsApp auto-send from the shop's OWN number** (Baileys) — more personal/
  branded than a generic system link.
- **Purpose-built, focused UI** — no leftover template demo apps.
- **Installable PWA**, clean mobile views.

## Gap analysis — what to consider adding

### High value
1. **Richer order status pipeline** — LaundryPro has pending/delivered; could add
   **Ready** / **Out for delivery** for the full lifecycle. (Considered, not built.)

### Medium value
3. **Invoice number + search by invoice no** — a human-friendly running invoice
   number, searchable alongside name/phone. (LaundryPro invoices exist but aren't
   searched by number.)
4. **Dashboard: surface the delivery pipeline** — today's Booking/Ready/Out/
   Delivered counts + Upcoming deliveries, like MyUniclean. LaundryPro already
   has the data (deliveries page) — just surface it on the dashboard.

### Larger / optional
5. **Customer-facing ordering ("Order Requests")** — a small customer web/app
   where end-customers request a pickup; shop approves → becomes an order. Bigger
   build (customer auth + portal). Only if the target shops want online orders.
6. **WhatsApp payment link** — a UPI deep-link/`upi://pay` line in the WhatsApp
   bill so the customer can pay in one tap. (Earlier you chose manual recording;
   this is a light, no-gateway enhancement, optional.)

## Design — what to change vs NOT change

- ❌ **Do NOT copy their template clutter** — MyUniclean shipped a generic admin
  theme with demo apps left in. LaundryPro's custom, laundry-focused UI is
  cleaner and more professional. Keep it.
- Keep LaundryPro's strengths front-and-centre (udhaar, statement, accounting,
  own-number WhatsApp) — these are real differentiators MyUniclean doesn't
  emphasise.

## Suggested priority

1. **Order status pipeline** (Ready / Out-for-delivery) — small, high clarity.
2. **Invoice number + search**.
3. **Customer-facing order requests** — only if there's real demand (biggest effort).

## Reports — detailed comparison (checked 2026-07-16)

MyUniclean's Report section has only **two** reports, both time-series summaries
(filter = Report-By preset [Today/Week/Month] + Start/End date):
- **Invoice-Report** — bills generated over the period.
- **Collection-Report** — money actually collected (payments received) over the period.

LaundryPro's Reports are **richer** on the billing side: Daily earnings, Service-wise,
Society-wise, Top customers, + Excel export.

**Actual content (verified with one live entry, 2026-07-16):**
- **Invoice-Report** = a flat per-invoice list — columns **Invoice No · Amount · Status
  (Pending/Paid) · Tax** with a **Total Invoice Amount** header + PDF/Excel/Print.
  (Invoice No format `INV-SH01160726-001`.) Example row: `INV-… · ₹60 · Pending · -`.
- **Collection-Report** = only money **actually received** — with the bill still Pending
  it showed **No Data Found** (₹0 collected). So Invoice = ₹60 billed, Collection = ₹0,
  Outstanding = ₹60.

**Gap to add in future (noted, not yet built):**
1. **Collection / cash-flow report** — **Billed vs Collected vs Outstanding (udhaar)**
   for a period + received payments by method (Cash / UPI) over time. We store payments
   (Accounting) already — this is a reporting view on top: "billed ₹X · collected ₹Y ·
   udhaar ₹Z" at a glance.
2. **Invoice-wise list report** — a flat per-bill list with Status (Pending/Paid) + Tax,
   like their Invoice-Report. Needs a human invoice number — which was dropped in Phase 4,
   so revisit invoice numbers if this report is wanted.
3. (Minor) Quick date presets (Today / Week / Month) on the Reports page.

**Dashboard KPIs they surface (for our dashboard work):** Collection Amount (today),
Pending Orders, Booking / Delivery / Delivered (today), Upcoming Deliveries.

## Open questions (decide before building)

- Do they want **customers to place orders online**, or keep it shop-entered only?
- Invoice numbering scheme (per-shop running number?).
