import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TokenPayload } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";

type DataAuditInput = {
  action: string;
  shop_id: string;
  entity_type: string;
  entity_id: string;
  entity_label?: string;
  metadata?: Record<string, unknown>;
};

export async function logDataAction(req: NextRequest, actor: TokenPayload, input: DataAuditInput) {
  await prisma.$executeRaw`
    INSERT INTO data_action_logs
      (actor_id, actor_username, actor_role, shop_id, action, entity_type, entity_id, entity_label, metadata, ip)
    VALUES
      (${actor.sub}, ${actor.username}, ${actor.role}, ${input.shop_id}, ${input.action},
       ${input.entity_type}, ${input.entity_id}, ${input.entity_label || ""},
       ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, ${getClientIp(req)})
  `.catch(() => {});
}
