import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy chi tiết phòng chiếu
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const screen = await prisma.screens.findUnique({
      where: { id: parseInt(id) },
      include: {
        branch: true,
        seats: { orderBy: [{ seat_row: "asc" }, { seat_number: "asc" }] },
        _count: { select: { showtimes: true } }
      }
    });

    if (!screen) {
      return NextResponse.json({ error: "Không tìm thấy phòng chiếu" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        seatRows: screen.seat_rows,
        seatCols: screen.seat_cols,
        status: screen.status,
        branch: screen.branch,
        seats: screen.seats.map(s => ({
          id: s.id,
          code: s.seat_code,
          row: s.seat_row,
          number: s.seat_number,
          type: s.seat_type
        })),
        showtimeCount: screen._count.showtimes
      }
    });
  } catch (error) {
    console.error("GET /api/admin/screens/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PATCH - Cập nhật phòng chiếu
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, type, seat_rows, seat_cols, status } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (seat_rows !== undefined) updateData.seat_rows = seat_rows;
    if (seat_cols !== undefined) updateData.seat_cols = seat_cols;
    if (status !== undefined) updateData.status = status;

    const screen = await prisma.screens.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({
      data: {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        seatRows: screen.seat_rows,
        seatCols: screen.seat_cols,
        status: screen.status
      }
    });
  } catch (error) {
    console.error("PATCH /api/admin/screens/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa phòng chiếu
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const screenId = parseInt(id);

    // Check if screen has active showtimes
    const showtimes = await prisma.showtimes.count({
      where: { screen_id: screenId }
    });

    if (showtimes > 0) {
      return NextResponse.json({ 
        error: `Không thể xóa - phòng chiếu có ${showtimes} suất chiếu` 
      }, { status: 400 });
    }

    // Delete seats first (cascade should handle but be explicit)
    await prisma.seats.deleteMany({ where: { screen_id: screenId } });
    
    // Delete screen
    await prisma.screens.delete({ where: { id: screenId } });

    return NextResponse.json({ success: true, message: "Đã xóa phòng chiếu" });
  } catch (error) {
    console.error("DELETE /api/admin/screens/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
