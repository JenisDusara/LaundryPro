import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail, deliveryEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getSettings } from "@/lib/settings";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const entry = await withRetry(() => prisma.laundryEntry.update({
    where: { id: params.id },
    data: { delivery_status: status },
    include: { customer: true },
  }));
  if (status === "delivered" && entry.customer) {
    const settings = getSettings();
    if (entry.customer.email) {
      sendEmail(entry.customer.email, `Laundry Ready - ${settings.shop_name}`,
        deliveryEmailHtml(entry.customer.name, settings.shop_name)
      ).catch(() => {});
    }
    if (entry.customer.phone) {
      sendSms(entry.customer.phone, `Dear ${entry.customer.name}, your laundry is ready for delivery! - ${settings.shop_name}`).catch(() => {});
    }
  }
  return NextResponse.json({ message: "Updated", status });
}
