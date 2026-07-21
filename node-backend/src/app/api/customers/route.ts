import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite, writeShopId } from "@/lib/auth";

const CUSTOMER_FIELDS = ["name", "phone", "flat_number", "society_name", "address", "email"] as const;

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const search = new URL(req.url).searchParams.get("search") || "";
  const filter = shopFilter(user, req);
  const customers = await withRetry(() => prisma.customer.findMany({
    where: {
      ...filter,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { flat_number: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { name: "asc" },
  }));
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  if (!body.phone || !/^\d{10}$/.test(body.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  // Superadmin writes go to the shop selected in the picker (x-selected-shop header);
  // regular users always write to their own shop. Fields are whitelisted so a crafted
  // request can't set shop_id/id directly.
  const shop_id = writeShopId(user, req, body.shop_id || "shop1");
  const existing = await prisma.customer.findFirst({ where: { phone: body.phone, shop_id } });
  if (existing) return NextResponse.json({ detail: "Phone already registered" }, { status: 400 });
  const data: Record<string, unknown> = { shop_id };
  for (const f of CUSTOMER_FIELDS) if (body[f] !== undefined) data[f] = body[f];
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
