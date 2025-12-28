import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST - Tạo lại ghế cho phòng chiếu
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const screenId = parseInt(id);

    // Get screen info
    const screen = await prisma.screens.findUnique({
      where: { id: screenId }
    });

    if (!screen) {
      return NextResponse.json({ error: "Không tìm thấy phòng chiếu" }, { status: 404 });
    }

    // Check if any seats are booked
    const bookedSeats = await prisma.booking_items.count({
      where: {
        seat: { screen_id: screenId },
        booking: { status: { in: ["reserved", "confirmed"] } }
      }
    });

    if (bookedSeats > 0) {
      return NextResponse.json({ 
        error: `Không thể tạo lại ghế - có ${bookedSeats} ghế đã được đặt` 
      }, { status: 400 });
    }

    // Delete existing seats
    await prisma.seats.deleteMany({ where: { screen_id: screenId } });

    // Generate new seats
    const seats = [];
    for (let row = 1; row <= screen.seat_rows; row++) {
      for (let col = 1; col <= screen.seat_cols; col++) {
        const rowLetter = String.fromCharCode(64 + row); // A, B, C...
        let seatType = "standard";
        
        // Last 2 rows are VIP
        if (row >= screen.seat_rows - 1) {
          seatType = "vip";
        }

        seats.push({
          screen_id: screenId,
          seat_code: `${rowLetter}${String(col).padStart(2, '0')}`,
          seat_row: rowLetter,
          seat_number: col,
          seat_type: seatType
        });
      }
    }

    await prisma.seats.createMany({ data: seats });

    // Get seat type counts
    const seatCounts = seats.reduce((acc, s) => {
      acc[s.seat_type] = (acc[s.seat_type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      data: {
        count: seats.length,
        breakdown: seatCounts
      },
      message: `Đã tạo ${seats.length} ghế thành công!`
    });
  } catch (error) {
    console.error("POST /api/admin/screens/[id]/seats error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// GET - Lấy danh sách ghế của phòng chiếu
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const seats = await prisma.seats.findMany({
      where: { screen_id: parseInt(id) },
      orderBy: [{ seat_row: "asc" }, { seat_number: "asc" }]
    });

    // Group by row
    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.seat_row]) acc[seat.seat_row] = [];
      acc[seat.seat_row].push({
        id: seat.id,
        code: seat.seat_code,
        row: seat.seat_row,
        number: seat.seat_number,
        type: seat.seat_type
      });
      return acc;
    }, {});

    return NextResponse.json({
      data: {
        total: seats.length,
        rows: Object.keys(seatsByRow).length,
        seatsByRow
      }
    });
  } catch (error) {
    console.error("GET /api/admin/screens/[id]/seats error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
