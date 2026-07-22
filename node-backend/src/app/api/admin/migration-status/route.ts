import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

type Check = { key: string; label: string; ok: boolean; detail: string };

async function hasColumn(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS ok
  `;
  return Boolean(rows[0]?.ok);
}

async function hasTable(table: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
    SELECT to_regclass(${`public.${table}`}) IS NOT NULL AS ok
  `;
  return Boolean(rows[0]?.ok);
}

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const checks: Check[] = [
    {
      key: "customers.billing_type",
      label: "Customer billing type",
      ok: await hasColumn("customers", "billing_type"),
      detail: "Required for monthly vs per-order bill separation.",
    },
    {
      key: "shop_profiles.wa_auto_enabled",
      label: "WhatsApp auto flag",
      ok: await hasColumn("shop_profiles", "wa_auto_enabled"),
      detail: "Required for Settings WhatsApp automation control.",
    },
    {
      key: "shop_profiles.wa_show_prices",
      label: "WhatsApp price display flag",
      ok: await hasColumn("shop_profiles", "wa_show_prices"),
      detail: "Required for Settings WhatsApp bill item price control.",
    },
    {
      key: "admins.token_version",
      label: "Login token version",
      ok: await hasColumn("admins", "token_version"),
      detail: "Required to expire sessions after password/status changes.",
    },
    {
      key: "admins.must_change_password",
      label: "Temporary password flag",
      ok: await hasColumn("admins", "must_change_password"),
      detail: "Required to force clients to change superadmin-created temporary passwords.",
    },
    {
      key: "superadmin_action_logs",
      label: "Superadmin audit log table",
      ok: await hasTable("superadmin_action_logs"),
      detail: "Required to record client changes by superadmin.",
    },
    {
      key: "customers.deleted_at",
      label: "Customer soft delete",
      ok: await hasColumn("customers", "deleted_at"),
      detail: "Required to restore mistakenly deleted customers.",
    },
    {
      key: "laundry_entries.deleted_at",
      label: "Order soft delete",
      ok: await hasColumn("laundry_entries", "deleted_at"),
      detail: "Required to restore mistakenly deleted orders.",
    },
    {
      key: "payments.deleted_at",
      label: "Payment soft delete",
      ok: await hasColumn("payments", "deleted_at"),
      detail: "Required to restore mistakenly deleted payments.",
    },
    {
      key: "expenses.deleted_at",
      label: "Expense soft delete",
      ok: await hasColumn("expenses", "deleted_at"),
      detail: "Required to restore mistakenly deleted expenses.",
    },
    {
      key: "labour_work.deleted_at",
      label: "Labour work soft delete",
      ok: await hasColumn("labour_work", "deleted_at"),
      detail: "Required to restore mistakenly deleted labour work rows.",
    },
    {
      key: "labour_advances.deleted_at",
      label: "Labour advance soft delete",
      ok: await hasColumn("labour_advances", "deleted_at"),
      detail: "Required to restore mistakenly deleted labour advances.",
    },
    {
      key: "data_action_logs",
      label: "Admin data audit log table",
      ok: await hasTable("data_action_logs"),
      detail: "Required to record delete and restore actions.",
    },
  ];

  return NextResponse.json({ ok: checks.every(c => c.ok), checks });
}
