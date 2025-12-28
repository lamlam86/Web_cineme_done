import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách phòng chiếu theo rạp
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");

    const where = branchId ? { branch_id: parseInt(branchId) } : {};

    const screens = await prisma.screens.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { seats: true, showtimes: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      data: screens.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        seatRows: s.seat_rows,
        seatCols: s.seat_cols,
        status: s.status,
        totalSeats: s._count.seats,
        showtimeCount: s._count.showtimes,
        branch: s.branch
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/screens error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo phòng chiếu mới
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const { branch_id, name, type, seat_rows, seat_cols, status } = body;

    if (!branch_id || !name || !type || !seat_rows || !seat_cols) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Check branch exists
    const branch = await prisma.branches.findUnique({ where: { id: branch_id } });
    if (!branch) {
      return NextResponse.json({ error: "Rạp không tồn tại" }, { status: 404 });
    }

    // Create screen
    const screen = await prisma.screens.create({
      data: {
        branch_id,
        name,
        type,
        seat_rows,
        seat_cols,
        status: status || "active"
      }
    });

    // Auto generate seats (last 2 rows are VIP)
    const seats = [];
    for (let row = 1; row <= seat_rows; row++) {
      for (let col = 1; col <= seat_cols; col++) {
        const rowLetter = String.fromCharCode(64 + row); // A, B, C...
        seats.push({
          screen_id: screen.id,
          seat_code: `${rowLetter}${String(col).padStart(2, '0')}`,
          seat_row: rowLetter,
          seat_number: col,
          seat_type: row >= seat_rows - 1 ? "vip" : "standard"
        });
      }
    }

    await prisma.seats.createMany({ data: seats });

    return NextResponse.json({
      data: {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        seatRows: screen.seat_rows,
        seatCols: screen.seat_cols,
        status: screen.status,
        totalSeats: seats.length
      },
      message: `Tạo phòng chiếu thành công với ${seats.length} ghế!`
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/screens error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
