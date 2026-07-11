import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { todayIST, monthRange } from "@/lib/dates";
import { sendEmail, completeSignupEmailHtml } from "@/lib/email";

const SETUP_LINK_VALID_DAYS = 3;

async function uniquePlaceholderUsername(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `pending_${crypto.randomBytes(6).toString("hex")}`;
    if (!(await prisma.admin.findUnique({ where: { username: candidate } }))) return candidate;
  }
  throw new Error("Could not generate a unique placeholder username");
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const clients = await prisma.$queryRaw<{
    id: string; username: string; name: string;
    shop_id: string; shop_name: string; is_active: boolean; created_at: Date;
    staff_count: bigint; plan_type: string | null; expires_at: Date | null;
  }[]>`
    SELECT a.id, a.username, a.name, a.shop_id, a.shop_name, a.is_active, a.created_at,
           a.plan_type, a.expires_at, COUNT(s.id) AS staff_count
    FROM admins a
    LEFT JOIN admins s ON s.shop_id = a.shop_id AND s.role = 'staff'
    WHERE a.role = 'admin'
    GROUP BY a.id
    ORDER BY a.created_at ASC
  `;

  // Per-shop business activity — computed separately to avoid multiplying the staff join.
  const [yy, mm] = todayIST().split("-").map(Number);
  const { start, end } = monthRange(yy, mm);
  const stats = await prisma.$queryRaw<{
    shop_id: string; total_entries: bigint; month_revenue: number | null; last_activity: string | null;
  }[]>`
    SELECT shop_id,
           COUNT(*) AS total_entries,
           SUM(CASE WHEN entry_date >= ${start} AND entry_date <= ${end} THEN total_amount ELSE 0 END) AS month_revenue,
           MAX(entry_date) AS last_activity
    FROM laundry_entries
    GROUP BY shop_id
  `;
  const statMap = new Map(stats.map(s => [s.shop_id, s]));

  return NextResponse.json(clients.map(c => {
    const st = statMap.get(c.shop_id);
    return {
      id: c.id,
      username: c.username,
      name: c.name,
      shop_id: c.shop_id,
      shop_name: c.shop_name,
      is_active: c.is_active,
      created_at: c.created_at,
      staff_count: Number(c.staff_count),
      plan_type: c.plan_type,
      expires_at: c.expires_at,
      total_entries: Number(st?.total_entries ?? 0),
      month_revenue: Number(st?.month_revenue ?? 0),
      last_activity: st?.last_activity ?? null,
    };
  }));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const { username, password, name, shop_id, shop_name, plan_type, expires_at, signup_request_id } = await req.json();
  if (!shop_id || !shop_name) {
    return NextResponse.json({ detail: "shop_id and shop_name are required" }, { status: 400 });
  }

  // Approving a signup request just means: create the shop as usual, then link
  // the two records — copy the lead's contact details into ShopProfile and mark
  // the request approved, so the new admin's email is pre-filled (weekly report,
  // invoices) without them having to re-enter it in Settings.
  let signupRequest = null;
  if (signup_request_id) {
    signupRequest = await prisma.signupRequest.findUnique({ where: { id: signup_request_id } });
    if (!signupRequest || signupRequest.status !== "pending") {
      return NextResponse.json({ detail: "Signup request not found or already reviewed" }, { status: 400 });
    }
  } else if (!username || !password) {
    return NextResponse.json({ detail: "username and password are required" }, { status: 400 });
  }

  if (username) {
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
  }

  const expiryDate = expires_at ? (() => { const d = new Date(expires_at); d.setHours(23,59,59,999); return d; })() : null;

  // For a signup-request approval, the customer chooses their own username/password
  // via a setup link — the account starts with an unusable random password and a
  // placeholder username that gets overwritten when they complete setup.
  const finalUsername = signupRequest ? await uniquePlaceholderUsername() : username;
  const finalPassword = signupRequest ? crypto.randomBytes(24).toString("hex") : password;
  const setupToken = signupRequest ? crypto.randomBytes(32).toString("hex") : null;
  const setupTokenExpires = signupRequest ? new Date(Date.now() + SETUP_LINK_VALID_DAYS * 24 * 60 * 60 * 1000) : null;

  const hash = await bcrypt.hash(finalPassword, 12);

  const client = await prisma.admin.create({
    data: {
      username: finalUsername, password_hash: hash, name: name || finalUsername,
      shop_id, shop_name, role: "admin",
      plan_type: plan_type || null,
      expires_at: expiryDate,
      setup_token: setupToken,
      setup_token_expires: setupTokenExpires,
    },
  });

  if (signupRequest) {
    await prisma.shopProfile.upsert({
      where: { shop_id },
      update: { email: signupRequest.email, phone: signupRequest.phone },
      create: { shop_id, shop_name, email: signupRequest.email, phone: signupRequest.phone },
    });
    await prisma.signupRequest.update({
      where: { id: signupRequest.id },
      data: { status: "approved", reviewed_at: new Date() },
    });

    // Best-effort — a failed email shouldn't undo the account that was just created.
    const setupUrl = `${new URL(req.url).origin}/complete-signup?token=${setupToken}`;
    sendEmail(signupRequest.email, `Welcome to LaundryPro — ${shop_name}`, completeSignupEmailHtml(shop_name, setupUrl))
      .catch(err => console.error("Failed to send complete-signup email:", err));
  }

  return NextResponse.json({
    id: client.id, username: client.username, name: client.name,
    shop_id: client.shop_id, shop_name: client.shop_name,
    plan_type: client.plan_type, expires_at: client.expires_at,
  }, { status: 201 });
}
