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
1. **Rider / delivery assignment & logistics** — "Unassigned Pickups" and
   "Unassigned Deliveries" imply assigning pickups/deliveries to delivery staff.
   *(LaundryPro does not have this.)*
2. **Order Requests** — customer-initiated online order requests (implies a
   customer-facing ordering channel + "Register Now" on login). *(LaundryPro is
   shop-only.)*
3. **Send WhatsApp Link** for collection — a payment/collection link over
   WhatsApp. *(LaundryPro sends reminders/bills, not a pay-link.)*
4. **Invoice number** as a first-class identifier (search by invoice no).
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
1. **Rider / pickup & delivery assignment** — assign each order's pickup and
   delivery to a delivery person; "unassigned" queues on the dashboard; basic
   status (assigned → picked up → delivered). Big operational win **if the shops
   do home pickup/delivery**. If shops are counter-only, skip.
2. **Richer order status pipeline** — LaundryPro has pending/delivered; consider
   adding **Ready** and **Out for delivery** so staff see the full lifecycle
   (Booked → Ready → Out for delivery → Delivered). Low effort, high clarity.

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
- ✅ **Adopt the order-pipeline emphasis** on the dashboard (pickup/ready/out/
  delivered + upcoming) — genuinely useful for daily ops.
- ✅ If adding logistics, add a simple **"Deliveries / Riders"** board (assign +
  status) — but keep it minimal, not a heavy template.
- Keep LaundryPro's strengths front-and-centre (udhaar, statement, accounting,
  own-number WhatsApp) — these are real differentiators MyUniclean doesn't
  emphasise.

## Suggested priority

1. **Order status pipeline** (Ready / Out-for-delivery) + surface on dashboard — small, high clarity.
2. **Rider/pickup-delivery assignment** — only if shops do home delivery (confirm with your clients first).
3. **Invoice number + search**.
4. **WhatsApp UPI pay-link** (light).
5. **Customer-facing order requests** — only if there's real demand (biggest effort).

## Open questions (decide before building)

- Do your target shops do **home pickup/delivery** (→ rider assignment worth it),
  or mostly **counter drop-off** (→ skip logistics)?
- Do they want **customers to place orders online**, or keep it shop-entered only?
- Invoice numbering scheme (per-shop running number?).
