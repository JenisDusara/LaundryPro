import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { withRetry } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const ip = getClientIp(req);

  try {
    if (!username || !password) {
      return NextResponse.json({ detail: "Username and password are required" }, { status: 400 });
    }

    const WINDOW_MIN = 15, MAX_USER_FAILS = 8, MAX_IP_FAILS = 30;
    const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000);

    // Per-IP throttle: one machine can only fail so many times in the window, no matter
    // which usernames it targets. This is the layer that actually limits brute-forcing
    // (and the bcrypt CPU cost below), and it runs before we touch the DB user record.
    if (ip !== "unknown") {
      const ipFails = await withRetry(() => prisma.loginLog.count({
        where: { ip, status: "failed", created_at: { gte: since } },
      })).catch(() => 0);
      if (ipFails >= MAX_IP_FAILS) {
        await withRetry(() => prisma.loginLog.create({
          data: { username: username || "", name: "", shop_id: "", shop_name: "", role: "", status: "failed", reason: "Rate limited (IP)", ip },
        })).catch(() => {});
        return NextResponse.json(
          { detail: `Too many attempts from this network. Please try again after ${WINDOW_MIN} minutes.` },
          { status: 429 }
        );
      }
    }

    const admin = await withRetry(() => prisma.admin.findUnique({ where: { username } }));

    if (!admin) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: username || "", name: "", shop_id: "", shop_name: "", role: "", status: "failed", reason: "User not found", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const passwordCandidates = password.trim() !== password
      ? [password, password.trim()]
      : [password];

    let valid = false;
    for (const candidate of passwordCandidates) {
      if (await bcrypt.compare(candidate, admin.password_hash)) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      // Per-username brute-force throttle, applied ONLY on the wrong-password path. A correct
      // password is never blocked by this, so an attacker who spams wrong guesses at a known
      // username can no longer lock the real owner out — that was a trivial lockout DoS.
      const userFails = await withRetry(() => prisma.loginLog.count({
        where: { username: admin.username, status: "failed", created_at: { gte: since } },
      })).catch(() => 0);
      await withRetry(() => prisma.loginLog.create({
        data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Wrong password", ip },
      })).catch(() => {});
      if (userFails >= MAX_USER_FAILS) {
        return NextResponse.json(
          { detail: `Too many failed attempts. Please try again after ${WINDOW_MIN} minutes.` },
          { status: 429 }
        );
      }
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const activeRow = await prisma.$queryRaw<{ is_active: boolean; expires_at: Date | null; token_version: number; must_change_password: boolean }[]>`
      SELECT is_active, expires_at, token_version, must_change_password FROM admins WHERE id = ${admin.id}
    `;
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
            token_version: Number(activeRow[0]?.token_version ?? 0),
            must_change_password: Boolean(activeRow[0]?.must_change_password),
          });
          return NextResponse.json({ access_token: token, token_type: "bearer", read_only: true });
        }

        // Active plan — include expires_at in token so read_only is computed dynamically
        const token = signToken({
          sub: admin.id, username: admin.username,
          shop_id: admin.shop_id, shop_name: admin.shop_name,
          role: admin.role, expires_at: expiresAt.toISOString(),
          token_version: Number(activeRow[0]?.token_version ?? 0),
          must_change_password: Boolean(activeRow[0]?.must_change_password),
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
      token_version: Number(activeRow[0]?.token_version ?? 0),
      must_change_password: Boolean(activeRow[0]?.must_change_password),
    });
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
