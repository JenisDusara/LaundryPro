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
  if (p.get("customer_id")) where.customer_id = p.get("customer_id");

  try {
    const entries = await withRetry(() => prisma.laundryEntry.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { entry_date: "desc" },
    }));
    // Fetch delivery_date separately via raw SQL (Prisma client may not include it yet)
    const ids = entries.map(e => e.id);
    const ddRows: { id: string; delivery_date: string | null }[] = ids.length > 0
      ? await prisma.$queryRawUnsafe(
          `SELECT id::text, delivery_date FROM laundry_entries WHERE id::text = ANY($1::text[])`,
          ids
        )
      : [];
    const ddMap = new Map(ddRows.map(r => [r.id, r.delivery_date ?? null]));
    // Fetch delivered_qty per item the same way (column may not be in the client yet).
    const itemIds = entries.flatMap(e => e.items.map(i => i.id));
    const dqRows: { id: string; delivered_qty: number }[] = itemIds.length > 0
      ? await prisma.$queryRawUnsafe(
          `SELECT id::text, delivered_qty FROM entry_items WHERE id::text = ANY($1::text[])`,
          itemIds
        )
      : [];
    const dqMap = new Map(dqRows.map(r => [r.id, Number(r.delivered_qty) || 0]));
    return NextResponse.json(entries.map(e => ({
      ...e,
      delivery_date: ddMap.get(e.id) ?? null,
      total_amount: Number(e.total_amount),
      items: e.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal), delivered_qty: dqMap.get(i.id) ?? 0 })),
    })));
  } catch (err: any) {
    console.error("Entries GET error:", err?.message);
    return NextResponse.json({ detail: "Database is waking up, please try again in a moment." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { customer_id, notes, items, delivery_date } = await req.json();

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

  const today = todayIST();
  const entry = await prisma.laundryEntry.create({
    data: {
      customer_id,
      entry_date: today,
      total_amount: total,
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

  const profile = await getShopProfile(customer.shop_id);
  const shopName = profile.shop_name || "LaundryPro";
  if (customer.email) {
    sendEmail(customer.email, `Laundry Pickup - ${shopName}`,
      pickupEmailHtml(customer.name, entryItems, total, shopName)
    ).catch(() => {});
  }
  if (customer.phone) {
    sendSms(customer.phone, `Dear ${customer.name}, your laundry has been picked up. Total: Rs.${total}. - ${shopName}`).catch(() => {});
  }

  // Auto-send a WhatsApp bill from the shop's OWN number (via the WA-Service), if the shop
  // turned it on in Settings. Best-effort and defensive: a failure or a missing column
  // never blocks the entry that was already created.
  if (customer.phone) {
    let waOn = false;
    try {
      const rows = await prisma.$queryRawUnsafe<{ wa_auto_enabled: boolean }[]>(
        `SELECT wa_auto_enabled FROM shop_profiles WHERE shop_id = $1`, customer.shop_id
      );
      waOn = !!rows[0]?.wa_auto_enabled;
    } catch { /* column not present yet → feature off */ }
    if (waOn) {
      const lines = entryItems.map(i => `• ${i.service_name} ×${i.quantity} — ₹${Number(i.subtotal).toFixed(0)}`).join("\n");
      const msg = `Hi ${customer.name}! 🙏\n\n*${shopName}*\n🧺 New pickup:\n${lines}\n\nTotal: ₹${total}\n\nThank you!`;
      await waSend(customer.shop_id, customer.phone, msg);
    }
  }

  return NextResponse.json({
    ...entry,
    delivery_date: (entry as any).delivery_date ?? null,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  }, { status: 201 });
}
