import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách khuyến mãi
export async function GET() {
  try {
    const promotions = await prisma.promotions.findMany({
      orderBy: { id: "desc" }
    });

    return NextResponse.json({
      data: promotions.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        discount_type: p.discount_type,
        discount_value: Number(p.discount_value),
        max_usage: p.max_usage,
        usage_count: p.usage_count,
        min_order_value: p.min_order_value ? Number(p.min_order_value) : null,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/promotions error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo khuyến mãi mới
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, description, discount_type, discount_value, max_usage, min_order_value, start_date, end_date, status } = body;

    if (!name || !discount_type || !discount_value) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Check duplicate code
    if (code) {
      const existing = await prisma.promotions.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json({ error: "Mã khuyến mãi đã tồn tại" }, { status: 400 });
      }
    }

    const promotion = await prisma.promotions.create({
      data: {
        name,
        code: code || null,
        description: description || null,
        discount_type,
        discount_value,
        max_usage: max_usage || null,
        min_order_value: min_order_value || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || "draft"
      }
    });

    return NextResponse.json({ data: promotion }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/promotions error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


