import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy bảng giá vé
export async function GET() {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prices = await prisma.ticket_prices.findMany({
      orderBy: [{ screen_type: "asc" }, { seat_type: "asc" }]
    });

    return NextResponse.json({
      data: prices.map(p => ({
        id: p.id,
        screenType: p.screen_type,
        seatType: p.seat_type,
        price: Number(p.price),
        isActive: p.is_active
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/ticket-prices error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Thêm giá vé mới
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const { screen_type, seat_type, price } = body;

    if (!screen_type || !seat_type || price === undefined) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    const existing = await prisma.ticket_prices.findFirst({
      where: { screen_type, seat_type }
    });

    if (existing) {
      return NextResponse.json({ error: "Giá vé đã tồn tại cho loại này" }, { status: 400 });
    }

    const newPrice = await prisma.ticket_prices.create({
      data: { screen_type, seat_type, price, day_type: "weekday" }
    });

    return NextResponse.json({
      data: {
        id: newPrice.id,
        screenType: newPrice.screen_type,
        seatType: newPrice.seat_type,
        price: Number(newPrice.price),
        isActive: newPrice.is_active
      }
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/ticket-prices error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PATCH - Cập nhật giá vé
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const { id, price, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
    }

    const updateData = {};
    if (price !== undefined) updateData.price = price;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await prisma.ticket_prices.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        screenType: updated.screen_type,
        seatType: updated.seat_type,
        price: Number(updated.price),
        isActive: updated.is_active
      }
    });
  } catch (error) {
    console.error("PATCH /api/admin/ticket-prices error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
