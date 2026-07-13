# Customer Statement (Ledger) — Plan & Implementation

A per-customer statement that combines **every bill and every payment** into one
chronological ledger with a **running balance**, plus Billed / Paid / Due
totals — and a one-tap **"Send on WhatsApp"** summary.

## Goal

Before this, the Customers page only showed a customer's *net* balance
(billed − paid). For udhaar (credit) reconciliation the owner needs to see the
full history: which bills were raised, which payments came in (and how), and how
the balance moved over time — and to be able to send that to the customer.

## How it works

```
Customer row → "View statement"  (expanded row, desktop + mobile)
             → or phone ⋮ menu → "Statement"
   │
   ├─ GET /api/entries?customer_id=…    → all bills  (amount = +total)
   ├─ GET /api/payments?customer_id=…   → all payments (amount = −paid)
   │
   ├─ merge + sort by (date, created_at)
   ├─ running balance:  bal += row.amount   (bill adds, payment subtracts)
   └─ totals: billed, paid, outstanding = billed − paid
        │
        ▼
   Modal: totals header + ledger rows (label · date · ±amount · running Bal)
        │
        └─ "Send on WhatsApp" → summary text (billed / paid / due + UPI id)
```

Everything is read-only and computed client-side by combining the existing
entries and payments endpoints — no new API. Money is rounded to paise.

## UI

- **Trigger:** the customer's **"View statement"** button in the expanded row
  (works on desktop and mobile), and the phone **⋮ menu → Statement**.
- **Modal:**
  - Header: customer name + phone.
  - Totals row: **Billed / Paid / Due** (Due shows "Advance" when the customer
    is in credit).
  - Scrollable ledger: each row = description (bill items or
    `Payment · method`), date, signed amount (`+` bill / `−` payment), and the
    running balance after that transaction.
  - Footer: **Send on WhatsApp** — sends the customer a short statement
    (total billed, total paid, balance due, and the shop's UPI id when money is
    owed).

## Files

- `src/app/customers/page.tsx`
  - `openStatement(c)` — fetches entries + payments, builds the sorted ledger
    with running balance and totals into `statement` state.
  - `sendStatementWA()` — composes the WhatsApp summary and opens it via
    `openWhatsApp` (uses the shop name + UPI id from settings).
  - Statement modal (loading state + ledger) rendered near the other modals.
  - Triggers wired into the expanded customer row and the mobile ⋮ menu.

## Notes

- The statement uses the customer's full history (no month filter), unlike the
  Customers list which is scoped to the selected month.
- WhatsApp send opens the chat with a prefilled message — the owner still taps
  send in WhatsApp (nothing is sent automatically).
