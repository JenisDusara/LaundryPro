import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");    // "success" | "failed" | null
  const username = searchParams.get("username");
  const limit    = Math.min(Number(searchParams.get("limit") || "100"), 500);

  const logs = await withRetry(() =>
    prisma.loginLog.findMany({
      where: {
        ...(status   ? { status }                                             : {}),
        ...(username ? { username: { contains: username, mode: "insensitive" } } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
    })
  );

  return NextResponse.json(logs);
}
