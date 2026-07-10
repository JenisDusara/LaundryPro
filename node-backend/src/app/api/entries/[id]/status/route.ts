import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";
import { sendEmail, deliveryEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getShopProfile } from "@/lib/settings";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await withRetry(() => prisma.laundryEntry.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
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
  const entry = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id },
    include: { customer: true },
  }));
  if (status === "delivered" && entry?.customer) {
    const profile = await getShopProfile(entry.customer.shop_id);
    const shopName = profile.shop_name || "LaundryPro";
    if (entry.customer?.email) {
      sendEmail(entry.customer.email, `Laundry Ready - ${shopName}`,
        deliveryEmailHtml(entry.customer.name, shopName)
      ).catch(() => {});
    }
    if (entry.customer?.phone) {
      sendSms(entry.customer.phone, `Dear ${entry.customer.name}, your laundry is ready for delivery! - ${shopName}`).catch(() => {});
    }
  }
  return NextResponse.json({ message: "Updated", status });
}
