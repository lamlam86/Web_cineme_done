import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Kiểm tra ghế đã được đặt chưa
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const seatsParam = searchParams.get("seats");

    if (!seatsParam) {
      return NextResponse.json({ bookedSeats: [] });
    }

    const seatIds = seatsParam.split(",").map(s => parseInt(s.trim())).filter(s => !isNaN(s));

    if (seatIds.length === 0) {
      return NextResponse.json({ bookedSeats: [] });
    }

    // Tìm các ghế đã được đặt
    const bookedItems = await prisma.booking_items.findMany({
      where: {
        seat_id: { in: seatIds },
        booking: {
          showtime_id: BigInt(id),
          status: { in: ["reserved", "confirmed"] },
        },
      },
      include: {
        seat: true,
      },
    });

    const bookedSeats = bookedItems.map(item => ({
      seat_id: item.seat_id,
      seat_code: item.seat.seat_code,
    }));

    return NextResponse.json({
      bookedSeats,
      checkedSeats: seatIds,
    });
  } catch (error) {
    console.error("GET /api/showtimes/[id]/check-seats error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

