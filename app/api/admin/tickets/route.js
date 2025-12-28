import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';


// GET - Lấy danh sách vé theo suất chiếu
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showtime_id = searchParams.get("showtime_id");

    if (!showtime_id) {
      return NextResponse.json({ error: "Vui lòng chọn suất chiếu" }, { status: 400 });
    }

    // Get showtime with seats info
    const showtime = await prisma.showtimes.findUnique({
      where: { id: BigInt(showtime_id) },
      include: {
        movie: true,
        screen: {
          include: {
            branch: true,
            seats: {
              orderBy: [{ seat_row: "asc" }, { seat_number: "asc" }]
            }
          }
        },
        bookings: {
          where: { status: { not: "cancelled" } },
          include: {
            booking_items: true,
            user: { select: { id: true, full_name: true, email: true, phone: true } }
          }
        }
      }
    });

    if (!showtime) {
      return NextResponse.json({ error: "Không tìm thấy suất chiếu" }, { status: 404 });
    }

    // Get ticket prices for this screen type
    const screenType = showtime.screen.type;
    
    const ticketPrices = await prisma.ticket_prices.findMany({
      where: {
        screen_type: screenType,
        is_active: true
      }
    });

    // Build price map by seat type
    const priceMap = {};
    ticketPrices.forEach(tp => {
      priceMap[tp.seat_type] = Number(tp.price);
    });

    // Get booked seat IDs
    const bookedSeatIds = showtime.bookings.flatMap(b => b.booking_items.map(i => i.seat_id));

    // Format seats with booking status and price
    const seats = showtime.screen.seats.map(seat => ({
      id: seat.id,
      code: seat.seat_code,
      row: seat.seat_row,
      number: seat.seat_number,
      type: seat.seat_type,
      price: priceMap[seat.seat_type] || priceMap["standard"] || 65000,
      isBooked: bookedSeatIds.includes(seat.id),
      booking: showtime.bookings.find(b => b.booking_items.some(i => i.seat_id === seat.id)) || null
    }));

    // Format bookings list
    const bookings = showtime.bookings.map(b => ({
      id: Number(b.id),
      code: b.booking_code,
      user: b.user ? { id: Number(b.user.id), name: b.user.full_name, email: b.user.email, phone: b.user.phone } : null,
      seats: b.booking_items.map(i => {
        const seat = showtime.screen.seats.find(s => s.id === i.seat_id);
        return seat?.seat_code;
      }).filter(Boolean),
      total: Number(b.total_amount),
      status: b.status,
      paymentStatus: b.payment_status,
      createdAt: b.created_at
    }));

    return NextResponse.json({
      data: {
        showtime: {
          id: Number(showtime.id),
          movie: { id: Number(showtime.movie.id), title: showtime.movie.title, duration: showtime.movie.duration_minutes },
          branch: { id: showtime.screen.branch.id, name: showtime.screen.branch.name },
          screen: { id: showtime.screen.id, name: showtime.screen.name, type: showtime.screen.type },
          startTime: showtime.start_time,
          status: showtime.status
        },
        seats,
        bookings,
        priceMap,
        stats: {
          totalSeats: seats.length,
          bookedSeats: bookedSeatIds.length,
          availableSeats: seats.length - bookedSeatIds.length
        }
      }
    });
  } catch (error) {
    console.error("GET /api/admin/tickets error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


// POST - Tạo vé mới (đặt ghế)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { showtime_id, seat_ids, customer_email } = body;

    if (!showtime_id || !seat_ids?.length) {
      return NextResponse.json({ error: "Vui lòng chọn suất chiếu và ghế" }, { status: 400 });
    }

    // Get showtime with screen info
    const showtime = await prisma.showtimes.findUnique({
      where: { id: BigInt(showtime_id) },
      include: { screen: { include: { seats: true } } }
    });

    if (!showtime) {
      return NextResponse.json({ error: "Không tìm thấy suất chiếu" }, { status: 404 });
    }

    // Check if seats are already booked
    const existingBookings = await prisma.booking_items.findMany({
      where: {
        seat_id: { in: seat_ids },
        booking: {
          showtime_id: BigInt(showtime_id),
          status: { not: "cancelled" }
        }
      }
    });

    if (existingBookings.length > 0) {
      return NextResponse.json({ error: "Một số ghế đã được đặt" }, { status: 400 });
    }

    // Get ticket prices from ticket_prices table
    const screenType = showtime.screen.type;
    
    const ticketPrices = await prisma.ticket_prices.findMany({
      where: {
        screen_type: screenType,
        is_active: true
      }
    });

    // Build price map by seat type
    const priceMap = {};
    ticketPrices.forEach(tp => {
      priceMap[tp.seat_type] = Number(tp.price);
    });

    // Calculate price for each seat
    const seats = showtime.screen.seats.filter(s => seat_ids.includes(s.id));
    const seatPrices = seats.map(seat => {
      const price = priceMap[seat.seat_type] || priceMap["standard"] || 65000;
      return { seat, price };
    });

    const subtotal = seatPrices.reduce((sum, sp) => sum + sp.price, 0);

    // Generate booking code
    const bookingCode = `TK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Find user if email provided
    let userId = null;
    if (customer_email) {
      const existingUser = await prisma.users.findUnique({ where: { email: customer_email } });
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    // Create booking
    const booking = await prisma.bookings.create({
      data: {
        user_id: userId,
        showtime_id: BigInt(showtime_id),
        booking_code: bookingCode,
        subtotal,
        total_amount: subtotal,
        payment_method: "cash",
        payment_status: "paid",
        status: "confirmed",
        paid_at: new Date(),
        booking_items: {
          create: seatPrices.map(sp => ({
            seat_id: sp.seat.id,
            seat_price: sp.price
          }))
        }
      },
      include: {
        booking_items: { include: { seat: true } }
      }
    });

    return NextResponse.json({
      data: {
        id: Number(booking.id),
        code: booking.booking_code,
        seats: booking.booking_items.map(i => i.seat.seat_code),
        total: Number(booking.total_amount),
        status: booking.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/tickets error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
