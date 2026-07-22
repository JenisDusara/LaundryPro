import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TokenPayload } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";

type AuditInput = {
  action: string;
  target_admin_id?: string;
  target_shop_id?: string;
  target_shop_name?: string;
  metadata?: Record<string, unknown>;
};

export async function logSuperadminAction(req: NextRequest, actor: TokenPayload, input: AuditInput) {
  if (actor.role !== "superadmin") return;
  await prisma.$executeRaw`
    INSERT INTO superadmin_action_logs
      (actor_id, actor_username, action, target_admin_id, target_shop_id, target_shop_name, metadata, ip)
    VALUES
      (${actor.sub}, ${actor.username}, ${input.action}, ${input.target_admin_id || ""},
       ${input.target_shop_id || ""}, ${input.target_shop_name || ""},
       ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, ${getClientIp(req)})
  `.catch(() => {});
}
