import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    const token = signToken({ sub: admin.id, username: admin.username });
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch (e) {
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
