import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";
import { sendEmail, pickupEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { waSend } from "@/lib/waAuto";
import { getShopProfile } from "@/lib/settings";
import { todayIST, monthRange } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const p = new URL(req.url).searchParams;
  const where: any = { ...shopFilter(user, req) };
  if (p.get("entry_date")) where.entry_date = p.get("entry_date");
  if (p.get("month") && p.get("year")) {
    const m = parseInt(p.get("month")!), y = parseInt(p.get("year")!);
    const { start, end } = monthRange(y, m);
    where.entry_date = { gte: start, lte: end };
  }
  // Date range (from–to) — used by the new Entries filter bar.
  if (p.get("from") && p.get("to")) where.entry_date = { gte: p.get("from")!, lte: p.get("to")! };
  if (p.get("customer_id")) where.customer_id = p.get("customer_id");

  try {
    const entries = await withRetry(() => prisma.laundryEntry.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { entry_date: "desc" },
    }));
    // Fetch delivery_date + billing columns via raw SQL (Prisma client may not include them yet)
    const ids = entries.map(e => e.id);
    const ddRows: { id: string; delivery_date: string | null; discount: any; extra_charge: any; amount_paid: any; payment_method: string | null; invoice_no: number | null }[] = ids.length > 0
      ? await prisma.$queryRawUnsafe(
          `SELECT id::text, delivery_date, discount, extra_charge, amount_paid, payment_method, invoice_no FROM laundry_entries WHERE id::text = ANY($1::text[])`,
          ids
        )
      : [];
    const ddMap = new Map(ddRows.map(r => [r.id, r]));
    // Fetch delivered_qty per item the same way (column may not be in the client yet).
    const itemIds = entries.flatMap(e => e.items.map(i => i.id));
    const dqRows: { id: string; delivered_qty: number }[] = itemIds.length > 0
      ? await prisma.$queryRawUnsafe(
          `SELECT id::text, delivered_qty FROM entry_items WHERE id::text = ANY($1::text[])`,
          itemIds
        )
      : [];
    const dqMap = new Map(dqRows.map(r => [r.id, Number(r.delivered_qty) || 0]));
    return NextResponse.json(entries.map(e => {
      const extra = ddMap.get(e.id);
      return {
        ...e,
        delivery_date: extra?.delivery_date ?? null,
        discount: extra?.discount != null ? Number(extra.discount) : 0,
        extra_charge: extra?.extra_charge != null ? Number(extra.extra_charge) : 0,
        amount_paid: extra?.amount_paid != null ? Number(extra.amount_paid) : 0,
        payment_method: extra?.payment_method ?? "",
        invoice_no: extra?.invoice_no ?? null,
        total_amount: Number(e.total_amount),
        items: e.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal), delivered_qty: dqMap.get(i.id) ?? 0 })),
      };
    }));
  } catch (err: any) {
    console.error("Entries GET error:", err?.message);
    return NextResponse.json({ detail: "Database is waking up, please try again in a moment." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { customer_id, notes, items, delivery_date, delivered, discount, extra_charge, amount_paid, payment_method } = await req.json();
  // Billing fields (all optional; default to 0 / empty so old callers keep working).
  const discountN = Math.max(0, Number(discount) || 0);
  const extraN    = Math.max(0, Number(extra_charge) || 0);
  const paidN     = Math.max(0, Number(amount_paid) || 0);
  const payMethodRaw = typeof payment_method === "string" ? payment_method.trim().toLowerCase() : "";
  // `delivered` (optional): items from earlier orders handed back to the customer in this
  // same visit (new-entry page marks them delivered "silently" so pickup + delivery go out
  // as ONE message instead of two). Shape: [{ service_name, quantity, pickup_date }].
  const deliveredNotice: { service_name: string; quantity: number; pickup_date: string }[] =
    Array.isArray(delivered)
      ? delivered
          .filter((d: any) => d && d.service_name && d.pickup_date)
          .map((d: any) => ({ service_name: String(d.service_name), quantity: Number(d.quantity) || 0, pickup_date: String(d.pickup_date) }))
      : [];

  const customer = await prisma.customer.findFirst({ where: { id: customer_id, ...shopFilter(user, req) } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ detail: "At least one item is required" }, { status: 400 });
  }

  // Guard against negative / NaN / fractional quantities and negative prices — otherwise a
  // malformed request produces a negative or garbage total that corrupts the customer's balance.
  for (const item of items) {
    const q = Number(item.quantity), pr = Number(item.price_per_unit);
    if (!Number.isInteger(q) || q < 1 || !Number.isFinite(pr) || pr < 0) {
      return NextResponse.json({ detail: "Each item needs a whole quantity ≥ 1 and a price ≥ 0" }, { status: 400 });
    }
  }

  let total = 0;
  const entryItems = items.map((item: any) => {
    const subtotal = Number(item.price_per_unit) * Number(item.quantity);
    total += subtotal;
    return {
      service_id: item.service_id,
      service_name: item.service_name,
      price_per_unit: Number(item.price_per_unit),
      quantity: Number(item.quantity),
      subtotal,
      item_status: "pending",
    };
  });

  // Grand total the customer actually owes = items − discount + extra charge (never below 0).
  // Stored as total_amount so the udhaar/statement math (billed − paid) stays correct.
  const itemsTotal = total;
  const grandTotal = Math.max(0, itemsTotal - discountN + extraN);

  const today = todayIST();
  const entry = await prisma.laundryEntry.create({
    data: {
      customer_id,
      entry_date: today,
      total_amount: grandTotal,
      delivery_status: "pending",
      notes: notes || "",
      // Bind the entry to the customer's shop — for a regular admin this equals
      // user.shop_id (the customer was looked up shop-scoped), and for a superadmin
      // it correctly targets the selected shop instead of "superadmin".
      shop_id: customer.shop_id,
      items: { create: entryItems },
    },
    include: { customer: true, items: true },
  });

  // Set delivery_date via raw SQL (Prisma client may not have this field yet)
  if (delivery_date) {
    await prisma.$executeRawUnsafe(`UPDATE laundry_entries SET delivery_date = $1 WHERE id::text = $2`, delivery_date, entry.id);
  }

  // Assign a per-shop running invoice number (starts at 1) + persist billing fields.
  // A per-shop advisory lock inside the transaction serialises numbering so two
  // concurrent entries can't grab the same invoice_no. Defensive: on any failure the
  // entry (already created) is left as-is with a null invoice_no.
  let invoiceNo: number | null = null;
  try {
    invoiceNo = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, `invoice:${customer.shop_id}`);
      const rows = await tx.$queryRawUnsafe<{ n: bigint }[]>(
        `SELECT COALESCE(MAX(invoice_no), 0) + 1 AS n FROM laundry_entries WHERE shop_id = $1`, customer.shop_id);
      const n = Number(rows[0]?.n ?? 1);
      await tx.$executeRawUnsafe(
        `UPDATE laundry_entries SET invoice_no = $1, discount = $2, extra_charge = $3, amount_paid = $4, payment_method = $5 WHERE id::text = $6`,
        n, discountN, extraN, paidN, payMethodRaw, entry.id);
      return n;
    });
  } catch (err: any) {
    console.error("invoice_no/billing update failed:", err?.message);
  }

  // Payment taken at billing → record it as a Payment so the customer's balance (udhaar) is
  // immediately correct. "Pay later" leaves paidN = 0, so no payment row is created.
  if (paidN > 0) {
    const method = payMethodRaw === "cash" || payMethodRaw === "upi" || payMethodRaw === "card" ? payMethodRaw : "other";
    try {
      await prisma.payment.create({
        data: {
          customer_id,
          amount: paidN,
          method,
          date: today,
          note: `Paid at billing${payMethodRaw && method === "other" ? ` (${payMethodRaw})` : ""}`,
          shop_id: customer.shop_id,
        },
      });
    } catch (err: any) {
      console.error("billing payment create failed:", err?.message);
    }
  }

  const profile = await getShopProfile(customer.shop_id);
  const shopName = profile.shop_name || "LaundryMax";

  // Group any just-delivered items by their original pickup date, for the "Delivered" section.
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const deliveredByDate = new Map<string, { service_name: string; quantity: number }[]>();
  for (const d of deliveredNotice) {
    if (!deliveredByDate.has(d.pickup_date)) deliveredByDate.set(d.pickup_date, []);
    deliveredByDate.get(d.pickup_date)!.push(d);
  }
  const hasDelivered = deliveredNotice.length > 0;

  if (customer.email) {
    sendEmail(customer.email, `Laundry ${hasDelivered ? "Update" : "Pickup"} - ${shopName}`,
      pickupEmailHtml(customer.name, entryItems, total, shopName, hasDelivered ? deliveredNotice : undefined)
    ).catch(() => {});
  }
  if (customer.phone) {
    const smsDelivered = hasDelivered ? `Your earlier order has been delivered. ` : "";
    sendSms(customer.phone, `Dear ${customer.name}, ${smsDelivered}your laundry has been picked up. Total: Rs.${total}. - ${shopName}`).catch(() => {});
  }

  // Auto-send a WhatsApp bill from the shop's OWN number (via the WA-Service), if the shop
  // turned it on in Settings. Best-effort and defensive: a failure or a missing column
  // never blocks the entry that was already created. When items were also delivered in the
  // same visit, both the delivery note (with its pickup dates) and the new pickup go out as
  // ONE combined message instead of two.
  if (customer.phone) {
    let waOn = false;
    try {
      const rows = await prisma.$queryRawUnsafe<{ wa_auto_enabled: boolean }[]>(
        `SELECT wa_auto_enabled FROM shop_profiles WHERE shop_id = $1`, customer.shop_id
      );
      waOn = !!rows[0]?.wa_auto_enabled;
    } catch { /* column not present yet → feature off */ }
    if (waOn) {
      const prettyDate = fmtDate(today);
      const totalQty = entryItems.reduce((s, i) => s + Number(i.quantity), 0);
      const lines = entryItems.map(i => `• ${i.service_name} ×${i.quantity}`).join("\n");
      let msg = `Hello ${customer.name},\n\n` + `Thank you for choosing *${shopName}*.\n\n`;
      if (hasDelivered) {
        const deliveredBlock = Array.from(deliveredByDate.entries())
          .map(([date, its]) => `_(Pickup: ${fmtDate(date)})_\n${its.map(i => `• ${i.service_name} ×${i.quantity}`).join("\n")}`)
          .join("\n\n");
        msg += `✅ *Delivered*\n${deliveredBlock}\n\n`;
      }
      // Bill summary — show the breakdown only when a discount/charge applies, else just the total.
      let bill = `*Total: ₹${grandTotal}*`;
      if (discountN > 0 || extraN > 0) {
        bill =
          `Subtotal: ₹${itemsTotal}\n` +
          (discountN > 0 ? `Discount: −₹${discountN}\n` : ``) +
          (extraN > 0 ? `Extra charge: +₹${extraN}\n` : ``) +
          `*Total: ₹${grandTotal}*`;
      }
      if (paidN > 0) {
        bill += `\nPaid: ₹${paidN}${payMethodRaw ? ` (${payMethodRaw})` : ``}`;
        const bal = Math.max(0, grandTotal - paidN);
        bill += bal > 0 ? `\nBalance due: ₹${bal}` : `\n✅ Fully paid`;
      } else if (grandTotal > 0) {
        bill += `\nBalance due: ₹${grandTotal}`;
      }
      msg +=
        `🧺 *New Pickup*\n` +
        `📅 ${prettyDate}\n` +
        (invoiceNo ? `🧾 Invoice: INV-${String(invoiceNo).padStart(4, "0")}\n` : ``) +
        `\n*Items received:*\n${lines}\n\n` +
        `Total items: ${totalQty}\n\n` +
        `${bill}\n\n` +
        `Warm regards,\n*${shopName}* 🙏`;
      await waSend(customer.shop_id, customer.phone, msg);
    }
  }

  return NextResponse.json({
    ...entry,
    delivery_date: (entry as any).delivery_date ?? null,
    invoice_no: invoiceNo,
    discount: discountN,
    extra_charge: extraN,
    amount_paid: paidN,
    payment_method: payMethodRaw,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  }, { status: 201 });
}
