import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { sendEmail, accountActivatedEmailHtml } from "@/lib/email";
import { getShopProfile } from "@/lib/settings";

// Lets the setup page show "link invalid/expired" immediately instead of only
// discovering it on submit.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ detail: "Missing token" }, { status: 400 });

  const admin = await prisma.admin.findUnique({ where: { setup_token: token } });
  if (!admin || !admin.setup_token_expires || admin.setup_token_expires < new Date()) {
    return NextResponse.json({ detail: "This setup link is invalid or has expired" }, { status: 400 });
  }
  return NextResponse.json({ shop_name: admin.shop_name });
}

// Public — reached via the "Set up your account" link emailed after a signup
// request is approved. Lets the customer choose their own username/password
// instead of being emailed one, then logs them straight in.
export async function POST(req: NextRequest) {
  const { token, username, password } = await req.json().catch(() => ({}));
  if (!token || !username || !password) {
    return NextResponse.json({ detail: "token, username, and password are required" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ detail: "Password must be at least 6 characters" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { setup_token: token } });
  if (!admin || !admin.setup_token_expires || admin.setup_token_expires < new Date()) {
    return NextResponse.json({ detail: "This setup link is invalid or has expired" }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing && existing.id !== admin.id) {
    return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { username, password_hash: hash, setup_token: null, setup_token_expires: null },
  });

  // Best-effort, one-time — fires only on this first-setup completion, not on
  // every subsequent login.
  const notifyTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_USER;
  if (notifyTo) {
    const profile = await getShopProfile(updated.shop_id);
    sendEmail(notifyTo, `Account activated — ${updated.shop_name}`, accountActivatedEmailHtml(updated.shop_name, updated.username, {
      shopId: updated.shop_id,
      ownerName: updated.name,
      phone: profile.phone,
      email: profile.email,
      planType: updated.plan_type,
      expiresAt: updated.expires_at,
    })).catch(err => console.error("Failed to send account-activated email:", err));
  }

  const jwt = signToken({
    sub: updated.id, username: updated.username,
    shop_id: updated.shop_id, shop_name: updated.shop_name,
    role: updated.role,
    expires_at: updated.expires_at ? updated.expires_at.toISOString() : undefined,
  });
  return NextResponse.json({ access_token: jwt, token_type: "bearer" });
}
