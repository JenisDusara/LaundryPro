import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { detail: "Account setup links are disabled. Contact the administrator for username and temporary password." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { detail: "Account setup links are disabled. Contact the administrator for username and temporary password." },
    { status: 410 }
  );
}
