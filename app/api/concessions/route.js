import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách bắp nước
export async function GET() {
  try {
    const concessions = await prisma.concessions.findMany({
      orderBy: [{ type: "asc" }, { price: "asc" }],
    });

    // Group by type
    const grouped = concessions.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image_url: item.image_url,
        type: item.type,
      });
      return acc;
    }, {});

    return NextResponse.json({
      concessions: grouped,
      all: concessions.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image_url: item.image_url,
        type: item.type,
      })),
    });
  } catch (error) {
    console.error("GET /api/concessions error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}









