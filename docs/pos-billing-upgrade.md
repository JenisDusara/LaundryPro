# POS Billing Upgrade — Plan & Implementation

Turn LaundryPro's billing into a fast, POS-style flow with a proper garment
catalog (category + service-type + per-item price), discount / charges, payment
at billing, and running invoice numbers — to match/beat competitors (MyUniclean)
for the all-India laundry market. Core stays **billing + data**; logistics
(rider/pickup routing) and customer online-ordering are intentionally out of scope.

## Goal

Today: new-entry = customer search + services (2-level) added one by one.
Target: a **POS terminal** — filter a garment catalog by category & service-type,
tap to add items into a running cart, apply discount/charges, take payment, and
book — with a running invoice number saved for records.

## Data model changes (additive, safe)

**Service (catalog item)** — `prisma/schema.prisma`
- add `category String?` — MEN / WOMEN / KIDS / HOUSEHOLD / INSTITUTIONAL / OTHERS (optional filter)
- (existing) `parent_id` used as **service-type** grouping; `price` per item.

**LaundryEntry (the bill)**
- `invoice_no Int?` — human-friendly running number per shop
- `discount Decimal @default(0)`
- `extra_charge Decimal @default(0)`
- `amount_paid Decimal @default(0)` — collected at billing
- `payment_method String @default("")` — cash / upi / online / later
- (grand total = sum(items) − discount + extra_charge)

All added via additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (no data loss),
and read/written defensively (raw SQL) so nothing breaks before the client is
regenerated — same pattern already used for delivery_date / wa_auto_enabled.

## Phases

### Phase 1 — Catalog model + Services page
- Add `category` to Service (schema + ALTER).
- Services page: category field in add/edit; show category chip; group/filter by
  category + service-type.
- (Optional) seed a default Indian garment catalog shops can price-edit.

### Phase 2 — POS new-entry (fast billing)
- Rebuild the New Entry item area as a POS: **category tabs + service-type tabs +
  item grid (tap "ADD")** feeding the existing right-side cart/order summary.
- Keep customer search, notes, delivery date.

### Phase 3 — Billing fields (discount / charges / payment)
- New-entry cart: **Discount** and **Extra charge** inputs; live Grand Total.
- **Payment at billing:** Cash / UPI / Online / Pay-later → on save, record the
  amount_paid + method (creates a Payment row, so udhaar stays correct).

### Phase 4 — Invoice number + search
- Generate a per-shop running `invoice_no` on entry creation.
- Show it on the invoice; make it searchable (Entries search by invoice no).

## Out of scope (by design — core is billing + data)
- Rider / pickup–delivery assignment & routing
- Customer-facing online ordering / customer portal
- Home / express delivery logistics (only an optional "express charge" via Phase 3)

## Kept as-is (already strong)
Udhaar + customer statement, accounting, labour, WhatsApp auto-send, PWA,
multi-tenant, invoices (PDF/HTML) — untouched; only billing/catalog is upgraded.

## Status
- [ ] Phase 1 — catalog category (schema + Services page)
- [ ] Phase 2 — POS new-entry
- [ ] Phase 3 — discount / charges / payment-at-billing
- [ ] Phase 4 — invoice number + search
