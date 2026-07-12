import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// Reject only — "approve" happens as a side effect of POST /api/admin/shops
// (passing signup_request_id), since approving means an actual shop account
// gets created, not just a status flip.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const { status } = await req.json().catch(() => ({}));
  if (status !== "rejected") {
    return NextResponse.json({ detail: "Only status='rejected' is supported here" }, { status: 400 });
  }

  const existing = await prisma.signupRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  // Only a pending request can be rejected. An already-approved request has a live shop
  // account behind it — flipping it to "rejected" would only lie in the audit trail.
  if (existing.status !== "pending") {
    return NextResponse.json({ detail: `Request already ${existing.status}` }, { status: 400 });
  }

  const updated = await prisma.signupRequest.update({
    where: { id: params.id },
    data: { status: "rejected", reviewed_at: new Date() },
  });
  return NextResponse.json(updated);
}
