import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET() {
  const reviews = await withRetry(() =>
    prisma.review.findMany({
      where: { shop_id: SHOP },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { created_at: "desc" },
    })
  );
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const { customer_id, entry_id, rating, comment } = await req.json();
  if (!customer_id || !rating) return NextResponse.json({ detail: "Customer and rating required" }, { status: 400 });
  const review = await withRetry(() =>
    prisma.review.create({
      data: { customer_id, entry_id: entry_id || null, rating: Number(rating), comment: comment || "", shop_id: SHOP },
      include: { customer: { select: { name: true, phone: true } } },
    })
  );
  return NextResponse.json(review, { status: 201 });
}
