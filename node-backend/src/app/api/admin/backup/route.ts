import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const [customers, services, entries, labours] = await Promise.all([
    prisma.customer.findMany(),
    prisma.service.findMany(),
    prisma.laundryEntry.findMany({ include: { items: true } }),
    prisma.labour.findMany({ include: { works: true } }),
  ]);
  const backup = { exported_at: new Date().toISOString(), customers, services, entries, labours };
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="laundrypro-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
