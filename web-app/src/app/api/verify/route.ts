import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter: ip -> { count, blockedUntil }
const attempts = new Map<string, { count: number; blockedUntil: number }>();

const MAX_ATTEMPTS  = 5;
const BLOCK_MS      = 10 * 60 * 1000; // 10 minutes

function getIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip  = getIP(req);
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, blockedUntil: 0 };

  // Still blocked?
  if (rec.blockedUntil > now) {
    const mins = Math.ceil((rec.blockedUntil - now) / 60000);
    return NextResponse.json(
      { ok: false, detail: `Too many attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD || "laundry2024";

  if (password === correct) {
    attempts.delete(ip); // reset on success
    const token = Buffer.from(correct + ":lp").toString("base64");
    return NextResponse.json({ ok: true, token });
  }

  // Wrong password — increment counter
  const newCount = rec.count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    attempts.set(ip, { count: newCount, blockedUntil: now + BLOCK_MS });
    return NextResponse.json(
      { ok: false, detail: "Too many wrong attempts. Blocked for 10 minutes." },
      { status: 429 }
    );
  }

  attempts.set(ip, { count: newCount, blockedUntil: 0 });
  const remaining = MAX_ATTEMPTS - newCount;
  return NextResponse.json(
    { ok: false, detail: `Incorrect password. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.` },
    { status: 401 }
  );
}
