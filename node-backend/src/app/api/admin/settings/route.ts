import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const data = await req.json();
  return NextResponse.json(updateSettings(data));
}
