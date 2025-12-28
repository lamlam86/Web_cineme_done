import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách combo
export async function GET() {
  try {
    const concessions = await prisma.concessions.findMany({
      include: {
        _count: { select: { booking_concessions: true } }
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({
      data: concessions.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        price: Number(c.price),
        type: c.type,
        image_url: c.image_url,
        totalSold: c._count.booking_concessions
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/combos error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo combo mới
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, type, image_url } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Tên và giá là bắt buộc" }, { status: 400 });
    }

    const concession = await prisma.concessions.create({
      data: {
        name,
        description: description || null,
        price,
        type: type || "combo",
        image_url: image_url || null
      }
    });

    return NextResponse.json({ data: concession }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/combos error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


