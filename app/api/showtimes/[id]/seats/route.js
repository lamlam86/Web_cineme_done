import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Lấy danh sách ghế và trạng thái đã đặt cho 1 suất chiếu
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const showtimeId = Number(id);

    if (isNaN(showtimeId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    // Lấy thông tin suất chiếu
    const showtime = await prisma.showtimes.findUnique({
      where: { id: showtimeId },
      include: {
        screen: {
          include: {
            seats: {
              orderBy: [{ seat_row: "asc" }, { seat_number: "asc" }],
            },
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: "Không tìm thấy suất chiếu" }, { status: 404 });
    }

    // Lấy danh sách ghế đã đặt cho suất chiếu này
    const bookedSeats = await prisma.booking_items.findMany({
      where: {
        booking: {
          showtime_id: showtimeId,
          status: { in: ["reserved", "confirmed"] },
        },
      },
      select: { seat_id: true },
    });

    const bookedSeatIds = new Set(bookedSeats.map((b) => b.seat_id));

    // Map ghế với trạng thái
    const seats = showtime.screen.seats.map((seat) => ({
      id: seat.id,
      seat_code: seat.seat_code,
      seat_row: seat.seat_row,
      seat_number: seat.seat_number,
      seat_type: seat.seat_type,
      status: bookedSeatIds.has(seat.id) ? "booked" : "available",
    }));

    // Group by row
    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.seat_row]) acc[seat.seat_row] = [];
      acc[seat.seat_row].push(seat);
      return acc;
    }, {});

    // Get ticket prices for this screen type
    const screenType = showtime.screen.type;
    
    const ticketPrices = await prisma.ticket_prices.findMany({
      where: {
        screen_type: screenType,
        is_active: true
      }
    });

    // Build price map
    const priceMap = {};
    ticketPrices.forEach(tp => {
      priceMap[tp.seat_type] = Number(tp.price);
    });

    // Default base price from standard seat
    const basePrice = priceMap["standard"] || 65000;

    return NextResponse.json({
      screen: {
        id: showtime.screen.id,
        name: showtime.screen.name,
        type: showtime.screen.type,
        seat_rows: showtime.screen.seat_rows,
        seat_cols: showtime.screen.seat_cols,
      },
      seats: seatsByRow,
      base_price: basePrice,
      price_map: priceMap,
    });
  } catch (error) {
    console.error("GET /api/showtimes/[id]/seats error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}









