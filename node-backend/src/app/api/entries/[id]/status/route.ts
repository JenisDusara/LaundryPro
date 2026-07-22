import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";
import { sendEmail, deliveryEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { waSend } from "@/lib/waAuto";
import { getShopProfile } from "@/lib/settings";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") || "pending";
  // The new-entry page marks deliveries "silently" and folds the delivery note into the
  // combined pickup message it sends on save — so we skip the standalone notifications here.
  const silent = sp.get("silent") === "1";
  const rows = await withRetry(() => prisma.laundryEntry.updateMany({
    where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any,
    data: { delivery_status: status },
  }));
  if (rows.count === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  // Sync every item to match — full quantities delivered (or reset), so item-level
  // partial counts stay consistent with the entry-level action. delivered_qty is set
  // via raw SQL since the generated client may not know the column yet.
  if (status === "delivered") {
    await withRetry(() => prisma.$executeRaw`
      UPDATE entry_items SET item_status = 'delivered', delivered_qty = quantity WHERE entry_id::text = ${params.id}
    `);
  } else {
    await withRetry(() => prisma.$executeRaw`
      UPDATE entry_items SET item_status = 'pending', delivered_qty = 0 WHERE entry_id::text = ${params.id}
    `);
  }
  const entry: any = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id, deleted_at: null },
    include: { customer: true, items: true },
  } as any));
  if (status === "delivered" && entry?.customer && !silent) {
    const profile = await getShopProfile(entry.customer.shop_id);
    const shopName = profile.shop_name || "LaundryMax";
    if (entry.customer?.email) {
      sendEmail(entry.customer.email, `Laundry Ready - ${shopName}`,
        deliveryEmailHtml(entry.customer.name, shopName)
      ).catch(() => {});
    }
    if (entry.customer?.phone) {
      sendSms(entry.customer.phone, `Dear ${entry.customer.name}, your laundry is ready for delivery! - ${shopName}`).catch(() => {});
    }

    // Auto-send a WhatsApp delivery note from the shop's OWN number (via the WA-Service),
    // if the shop turned it on in Settings. Best-effort — mirrors the pickup flow and
    // never blocks the status update that already succeeded.
    if (entry.customer?.phone) {
      let waOn = false;
      try {
        const rows = await prisma.$queryRawUnsafe<{ wa_auto_enabled: boolean }[]>(
          `SELECT wa_auto_enabled FROM shop_profiles WHERE shop_id = $1`, entry.customer.shop_id
        );
        waOn = !!rows[0]?.wa_auto_enabled;
      } catch { /* column not present yet → feature off */ }
      if (waOn) {
        const prettyDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const totalQty = entry.items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
        const lines = entry.items.map((i: any) => `• ${i.service_name} ×${i.quantity}`).join("\n");
        const msg =
          `Hello ${entry.customer.name},\n\n` +
          `Your order from *${shopName}* is ready! ✅\n\n` +
          `📦 *Delivery Details*\n` +
          `📅 ${prettyDate}\n\n` +
          `*Items:*\n${lines}\n\n` +
          `Total items: ${totalQty}\n\n` +
          `Thank you for your business.\n\n` +
          `Warm regards,\n*${shopName}* 🙏`;
        await waSend(entry.customer.shop_id, entry.customer.phone, msg).catch(() => {});
      }
    }
  }
  return NextResponse.json({ message: "Updated", status });
}
