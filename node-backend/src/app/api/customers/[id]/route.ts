import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

const BILLING_TYPES = new Set(["per_order", "monthly"]);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const customer = await withRetry(() => prisma.customer.findFirst({ where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any }));
  if (!customer) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const body = await req.json();
  if (body.phone !== undefined && !/^\d{10}$/.test(body.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  if (body.billing_type !== undefined && !BILLING_TYPES.has(body.billing_type)) {
    return NextResponse.json({ detail: "Invalid billing type" }, { status: 400 });
  }
  // Prevent editing a customer to a phone already used by another customer in this shop.
  if (body.phone !== undefined) {
    const clash = await withRetry(() => prisma.customer.findFirst({
      where: { phone: body.phone, deleted_at: null, ...shopFilter(user, req), NOT: { id: params.id } } as any,
      select: { id: true },
    }));
    if (clash) return NextResponse.json({ detail: "Another customer with this phone already exists" }, { status: 409 });
  }
  // Whitelist editable fields — never let the body set shop_id/id and move the record
  // out of (or into) another shop.
  const data: Record<string, unknown> = {};
  for (const f of ["name", "phone", "flat_number", "society_name", "address", "email", "billing_type"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  const customer = await withRetry(() => prisma.customer.updateMany({
    where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any,
    data,
  }));
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Ownership check FIRST — the cascade below deletes child rows by customer_id, which is
  // not shop-scoped, so we must confirm the customer belongs to the caller's shop before touching anything.
  const owned = await withRetry(() => prisma.customer.findFirst({
    where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any,
    select: { id: true, name: true, phone: true, shop_id: true },
  }));
  if (!owned) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const reason = new URL(req.url).searchParams.get("reason") || "customer_delete";
  await withRetry(() => prisma.$transaction([
    prisma.laundryEntry.updateMany({
      where: { customer_id: params.id, deleted_at: null } as any,
      data: { deleted_at: new Date(), deleted_by: user.sub, deleted_by_username: user.username, delete_reason: reason } as any,
    }),
    prisma.payment.updateMany({
      where: { customer_id: params.id, deleted_at: null } as any,
      data: { deleted_at: new Date(), deleted_by: user.sub, deleted_by_username: user.username, delete_reason: reason } as any,
    }),
    prisma.customer.updateMany({
      where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any,
      data: { deleted_at: new Date(), deleted_by: user.sub, deleted_by_username: user.username, delete_reason: reason } as any,
    }),
  ]));
  await logDataAction(req, user, {
    action: "customer.soft_deleted",
    shop_id: owned.shop_id,
    entity_type: "customer",
    entity_id: owned.id,
    entity_label: `${owned.name} (${owned.phone})`,
    metadata: { reason, cascade: ["laundry_entries", "payments"] },
  });
  return NextResponse.json({ message: "Deleted" });
}
