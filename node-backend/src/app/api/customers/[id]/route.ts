import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const customer = await withRetry(() => prisma.customer.findFirst({ where: { id: params.id, ...shopFilter(user, req) } }));
  if (!customer) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const body = await req.json();
  if (body.phone !== undefined && !/^\d{10}$/.test(body.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  // Prevent editing a customer to a phone already used by another customer in this shop.
  if (body.phone !== undefined) {
    const clash = await withRetry(() => prisma.customer.findFirst({
      where: { phone: body.phone, ...shopFilter(user, req), NOT: { id: params.id } },
      select: { id: true },
    }));
    if (clash) return NextResponse.json({ detail: "Another customer with this phone already exists" }, { status: 409 });
  }
  // Whitelist editable fields — never let the body set shop_id/id and move the record
  // out of (or into) another shop.
  const data: Record<string, unknown> = {};
  for (const f of ["name", "phone", "flat_number", "society_name", "address", "email"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  const customer = await withRetry(() => prisma.customer.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
    data,
  }));
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Ownership check FIRST — the cascade below deletes child rows by customer_id, which is
  // not shop-scoped, so we must confirm the customer belongs to the caller's shop before touching anything.
  const owned = await withRetry(() => prisma.customer.findFirst({
    where: { id: params.id, ...shopFilter(user, req) },
    select: { id: true },
  }));
  if (!owned) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const entries = await withRetry(() => prisma.laundryEntry.findMany({ where: { customer_id: params.id }, select: { id: true } }));
  const entryIds = entries.map(e => e.id);

  // Delete the whole customer graph atomically. Payments MUST be deleted too — Payment has no
  // onDelete cascade, so leaving them would (a) fail the final customer delete on the FK and
  // (b) leave orphaned payments still counting toward the shop's collection totals. Wrapping it
  // in one $transaction means a mid-way failure rolls everything back instead of destroying the
  // order history while the customer + payments survive.
  await withRetry(() => prisma.$transaction([
    ...(entryIds.length > 0 ? [prisma.entryItem.deleteMany({ where: { entry_id: { in: entryIds } } })] : []),
    prisma.laundryEntry.deleteMany({ where: { customer_id: params.id } }),
    prisma.payment.deleteMany({ where: { customer_id: params.id } }),
    prisma.customer.deleteMany({ where: { id: params.id, ...shopFilter(user, req) } }),
  ]));
  return NextResponse.json({ message: "Deleted" });
}
