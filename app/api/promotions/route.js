import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const promotions = await prisma.promotions.findMany({
      where: {
        status: "active",
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } }
        ]
      },
      orderBy: { id: "desc" },
      take: 10
    });

    return NextResponse.json({
      promotions: promotions.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        discount_type: p.discount_type,
        discount_value: Number(p.discount_value),
        start_date: p.start_date,
        end_date: p.end_date
      }))
    });
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

