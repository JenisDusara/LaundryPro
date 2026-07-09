import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter, denyStaff } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;

  // Scope the dump to the caller's shop. A regular admin backs up only their own shop;
  // a superadmin backs up the shop picked via x-selected-shop, or all shops if none is
  // selected. Previously this returned EVERY shop's data to ANY authenticated user.
  const scope = shopFilter(user, req);
  const [customers, services, entries, labours] = await Promise.all([
    prisma.customer.findMany({ where: scope }),
    prisma.service.findMany({ where: scope }),
    prisma.laundryEntry.findMany({ where: scope, include: { items: true } }),
    prisma.labour.findMany({ where: scope, include: { works: true } }),
  ]);
  const backup = { exported_at: new Date().toISOString(), customers, services, entries, labours };
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="laundrypro-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
