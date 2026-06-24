import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { withRetry } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  const ip = getIp(req);

  try {
    const admin = await withRetry(() => prisma.admin.findUnique({ where: { username } }));

    if (!admin) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: username || "", name: "", shop_id: "", shop_name: "", role: "", status: "failed", reason: "User not found", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Wrong password", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const activeRow = await prisma.$queryRaw<{ is_active: boolean; expires_at: Date | null }[]>`SELECT is_active, expires_at FROM admins WHERE id = ${admin.id}`;
    if (activeRow[0]?.is_active === false) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Account disabled", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Your account has been disabled. Contact the administrator." }, { status: 403 });
    }

    // Subscription expiry check (admin/staff only, not superadmin)
    if (admin.role !== "superadmin") {
      // For staff: check their shop admin's expiry; for admin: use own expiry
      let expiresAt: Date | null = activeRow[0]?.expires_at ?? null;
      if (admin.role === "staff" && !expiresAt) {
        const shopAdmin = await prisma.$queryRaw<{ expires_at: Date | null }[]>`
          SELECT expires_at FROM admins WHERE shop_id = ${admin.shop_id} AND role = 'admin' LIMIT 1
        `;
        expiresAt = shopAdmin[0]?.expires_at ?? null;
      }

      if (expiresAt) {
        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

        if (now > expiry + THREE_DAYS) {
          // Hard block — 3 days grace period over
          await prisma.$executeRaw`UPDATE admins SET is_active = false WHERE shop_id = ${admin.shop_id} AND role IN ('admin','staff')`;
          await withRetry(() => prisma.loginLog.create({
            data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Subscription expired (hard block)", ip },
          })).catch(() => {});
          return NextResponse.json({ detail: "Access blocked. Subscription expired 3+ days ago. Contact administrator to renew." }, { status: 403 });
        }

        if (now > expiry) {
          // Read-only grace period (0–3 days after expiry)
          await withRetry(() => prisma.loginLog.create({
            data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "success", reason: "Read-only (grace period)", ip },
          })).catch(() => {});
          const token = signToken({
            sub: admin.id, username: admin.username,
            shop_id: admin.shop_id, shop_name: admin.shop_name,
            role: admin.role, expires_at: expiresAt.toISOString(),
          });
          return NextResponse.json({ access_token: token, token_type: "bearer", read_only: true });
        }

        // Active plan — include expires_at in token so read_only is computed dynamically
        const token = signToken({
          sub: admin.id, username: admin.username,
          shop_id: admin.shop_id, shop_name: admin.shop_name,
          role: admin.role, expires_at: expiresAt.toISOString(),
        });
        await withRetry(() => prisma.loginLog.create({
          data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "success", reason: "", ip },
        })).catch(() => {});
        return NextResponse.json({ access_token: token, token_type: "bearer" });
      }
    }

    await withRetry(() => prisma.loginLog.create({
      data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "success", reason: "", ip },
    })).catch(() => {});

    const token = signToken({
      sub:       admin.id,
      username:  admin.username,
      shop_id:   admin.shop_id,
      shop_name: admin.shop_name,
      role:      admin.role,
    });
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch {
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
