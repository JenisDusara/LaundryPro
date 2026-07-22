import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

const TYPES = new Set(["customer", "entry", "payment", "expense", "labour_work", "labour_advance"]);

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  const entityType = String(body.entity_type || "");
  const entityId = String(body.entity_id || "");
  if (!TYPES.has(entityType) || !entityId) {
    return NextResponse.json({ detail: "entity_type and entity_id are required" }, { status: 400 });
  }

  const restoreData = { deleted_at: null, deleted_by: "", deleted_by_username: "", delete_reason: "" };

  if (entityType === "customer") {
    const row = await prisma.customer.findFirst({ where: { id: entityId, deleted_at: { not: null } } as any });
    if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.customer.update({ where: { id: entityId }, data: restoreData as any }),
      prisma.laundryEntry.updateMany({ where: { customer_id: entityId, deleted_at: { not: null } } as any, data: restoreData as any }),
      prisma.payment.updateMany({ where: { customer_id: entityId, deleted_at: { not: null } } as any, data: restoreData as any }),
    ]);
    await logDataAction(req, user, {
      action: "customer.restored",
      shop_id: row.shop_id,
      entity_type: "customer",
      entity_id: row.id,
      entity_label: `${row.name} (${row.phone})`,
      metadata: { cascade: ["laundry_entries", "payments"] },
    });
    return NextResponse.json({ message: "Restored" });
  }

  if (entityType === "entry") {
    const row: any = await prisma.laundryEntry.findFirst({ where: { id: entityId, deleted_at: { not: null } }, include: { customer: true } } as any);
    if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (row.customer?.deleted_at) return NextResponse.json({ detail: "Restore the customer first" }, { status: 409 });
    await prisma.laundryEntry.update({ where: { id: entityId }, data: restoreData as any });
    await logDataAction(req, user, {
      action: "entry.restored",
      shop_id: row.shop_id,
      entity_type: "entry",
      entity_id: row.id,
      entity_label: `${row.customer?.name || "Customer"} ${row.entry_date}`,
    });
    return NextResponse.json({ message: "Restored" });
  }

  if (entityType === "payment") {
    const row: any = await prisma.payment.findFirst({ where: { id: entityId, deleted_at: { not: null } }, include: { customer: true } } as any);
    if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (row.customer?.deleted_at) return NextResponse.json({ detail: "Restore the customer first" }, { status: 409 });
    await prisma.payment.update({ where: { id: entityId }, data: restoreData as any });
    await logDataAction(req, user, {
      action: "payment.restored",
      shop_id: row.shop_id,
      entity_type: "payment",
      entity_id: row.id,
      entity_label: `${row.customer?.name || "Customer"} payment`,
      metadata: { amount: Number(row.amount) },
    });
    return NextResponse.json({ message: "Restored" });
  }

  if (entityType === "expense") {
    const row = await prisma.expense.findFirst({ where: { id: entityId, deleted_at: { not: null } } as any });
    if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    await prisma.expense.update({ where: { id: entityId }, data: restoreData as any });
    await logDataAction(req, user, {
      action: "expense.restored",
      shop_id: row.shop_id,
      entity_type: "expense",
      entity_id: row.id,
      entity_label: `${row.category} ${row.date}`,
      metadata: { amount: Number(row.amount) },
    });
    return NextResponse.json({ message: "Restored" });
  }

  if (entityType === "labour_work") {
    const row: any = await prisma.labourWork.findFirst({ where: { id: entityId, deleted_at: { not: null } }, include: { labour: true } } as any);
    if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    await prisma.labourWork.update({ where: { id: entityId }, data: restoreData as any });
    await logDataAction(req, user, {
      action: "labour_work.restored",
      shop_id: row.labour.shop_id,
      entity_type: "labour_work",
      entity_id: row.id,
      entity_label: `${row.labour.name} ${row.work_date}`,
    });
    return NextResponse.json({ message: "Restored" });
  }

  const row: any = await prisma.labourAdvance.findFirst({ where: { id: entityId, deleted_at: { not: null } }, include: { labour: true } } as any);
  if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await prisma.labourAdvance.update({ where: { id: entityId }, data: restoreData as any });
  await logDataAction(req, user, {
    action: "labour_advance.restored",
    shop_id: row.labour.shop_id,
    entity_type: "labour_advance",
    entity_id: row.id,
    entity_label: `${row.labour.name} ${row.advance_date}`,
    metadata: { amount: Number(row.amount) },
  });
  return NextResponse.json({ message: "Restored" });
}
