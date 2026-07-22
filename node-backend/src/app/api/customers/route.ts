import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, writeShopId } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

const CUSTOMER_FIELDS = ["name", "phone", "flat_number", "society_name", "address", "email", "billing_type"] as const;
const BILLING_TYPES = new Set(["per_order", "monthly"]);

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const search = new URL(req.url).searchParams.get("search") || "";
  const filter = shopFilter(user, req);
  const customers = await withRetry(() => prisma.customer.findMany({
    where: {
      ...filter,
      deleted_at: null,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { flat_number: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    } as any,
    orderBy: { name: "asc" },
  }));
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  if (!body.phone || !/^\d{10}$/.test(body.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  if (body.billing_type !== undefined && !BILLING_TYPES.has(body.billing_type)) {
    return NextResponse.json({ detail: "Invalid billing type" }, { status: 400 });
  }
  // Superadmin writes go to the shop selected in the picker (x-selected-shop header);
  // regular users always write to their own shop. Fields are whitelisted so a crafted
  // request can't set shop_id/id directly.
  const shop_id = writeShopId(user, req, body.shop_id || "shop1");
  const existing = await prisma.customer.findFirst({ where: { phone: body.phone, shop_id, deleted_at: null } as any });
  if (existing) return NextResponse.json({ detail: "Phone already registered" }, { status: 400 });
  const data: Record<string, unknown> = { shop_id };
  for (const f of CUSTOMER_FIELDS) if (body[f] !== undefined) data[f] = body[f];
  const deletedExisting = await prisma.customer.findFirst({ where: { phone: body.phone, shop_id, deleted_at: { not: null } } as any });
  if (deletedExisting) {
    const restoreData = { deleted_at: null, deleted_by: "", deleted_by_username: "", delete_reason: "" };
    const [customer] = await prisma.$transaction([
      prisma.customer.update({ where: { id: deletedExisting.id }, data: { ...data, ...restoreData } as any }),
      prisma.laundryEntry.updateMany({ where: { customer_id: deletedExisting.id, deleted_at: { not: null } } as any, data: restoreData as any }),
      prisma.payment.updateMany({ where: { customer_id: deletedExisting.id, deleted_at: { not: null } } as any, data: restoreData as any }),
    ]);
    await logDataAction(req, user, {
      action: "customer.restored_by_readd",
      shop_id,
      entity_type: "customer",
      entity_id: deletedExisting.id,
      entity_label: `${customer.name} (${customer.phone})`,
      metadata: { cascade: ["laundry_entries", "payments"] },
    });
    return NextResponse.json(customer, { status: 200 });
  }
  try {
    const customer = await prisma.customer.create({ data: data as any });
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    // The findFirst check above isn't atomic; a concurrent double-submit can still hit the
    // @@unique([phone, shop_id]) constraint. Turn that into the same friendly message
    // instead of leaking a raw 500.
    if (e?.code === "P2002") {
      return NextResponse.json({ detail: "Phone already registered" }, { status: 400 });
    }
    throw e;
  }
}
