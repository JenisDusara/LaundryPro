import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { detail: "Public signup is disabled. Contact the administrator for username and temporary password." },
    { status: 410 }
  );
}
