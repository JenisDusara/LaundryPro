import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { detail: "Signup requests are disabled. Create clients manually with a temporary password." },
    { status: 410 }
  );
}
