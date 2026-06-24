import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { method, nextUrl } = req;
  const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
  const isApi = nextUrl.pathname.startsWith("/api/") && !nextUrl.pathname.startsWith("/api/verify");

  if (isApi && isMutation) {
    const token = req.headers.get("x-lp-token");
    const pw    = process.env.DASHBOARD_PASSWORD || "laundry2024";
    const valid = Buffer.from(pw + ":lp").toString("base64");
    if (token !== valid) {
      return NextResponse.json({ detail: "Login required to make changes." }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
