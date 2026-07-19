import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { sendEmail, newSignupRequestEmailHtml } from "@/lib/email";
import { getClientIp } from "@/lib/ip";

// Public, unauthenticated — the marketing site's "Start free trial" form posts here.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const shop_name  = String(body.shop_name  || "").trim().slice(0, 120);
  const owner_name = String(body.owner_name || "").trim().slice(0, 120);
  const phone      = String(body.phone      || "").trim().slice(0, 20);
  const email      = String(body.email      || "").trim().slice(0, 160);
  const city       = String(body.city       || "").trim().slice(0, 80);

  if (!shop_name || !owner_name || !phone || !email) {
    return NextResponse.json({ detail: "Shop name, owner name, phone, and email are required" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length !== 10) {
    return NextResponse.json({ detail: "Enter a valid 10-digit phone number" }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ detail: "Enter a valid email address" }, { status: 400 });
  }

  const ip = getClientIp(req);

  // Same DB-window rate-limit pattern as /api/auth/login: block an IP after
  // too many requests in a short window instead of a stateful in-memory limiter
  // (serverless invocations don't share memory).
  const WINDOW_MIN = 60, MAX_REQUESTS = 5;
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000);
  const recent = await withRetry(() => prisma.signupRequest.count({
    where: { ip, created_at: { gte: since } },
  })).catch(() => 0);
  if (recent >= MAX_REQUESTS) {
    return NextResponse.json({ detail: "Too many requests. Please try again later." }, { status: 429 });
  }

  await withRetry(() => prisma.signupRequest.create({
    data: { shop_name, owner_name, phone, email, city, ip },
  }));

  // Notify the business's own inbox so a human goes and reviews it. Best-effort —
  // a failed notification email should never block the customer's submission.
  const notifyTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_USER;
  if (notifyTo) {
    const reviewUrl = `${new URL(req.url).origin}/superadmin`;
    sendEmail(notifyTo, `New signup request — ${shop_name}`, newSignupRequestEmailHtml({ shop_name, owner_name, phone, email, city }, reviewUrl))
      .catch(err => console.error("Failed to send signup-request notification email:", err));
  }

  return NextResponse.json({ message: "Request received" }, { status: 201 });
}
