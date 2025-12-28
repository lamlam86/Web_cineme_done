import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

function generateBookingCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const { showtime_id, seats, concessions, payment_method = "momo" } = body;

    if (!showtime_id || !seats || seats.length === 0) {
      return NextResponse.json(
        { error: "Thiếu thông tin đặt vé" },
        { status: 400 }
      );
    }

    const showtimeIdBigInt = BigInt(showtime_id);

    const showtime = await prisma.showtimes.findUnique({
      where: { id: showtimeIdBigInt },
      include: {
        screen: true,
      },
    });

    if (!showtime) {
      return NextResponse.json(
        { error: "Suất chiếu không tồn tại" },
        { status: 404 }
      );
    }

    const seatIds = seats.map((s) => Number(s.seat_id));
    if (seatIds.some(isNaN)) {
      return NextResponse.json(
        { error: "ID ghế không hợp lệ" },
        { status: 400 }
      );
    }

    const existingBookings = await prisma.booking_items.findMany({
      where: {
        seat_id: { in: seatIds },
        booking: {
          showtime_id: showtimeIdBigInt,
          status: { in: ["reserved", "confirmed"] },
        },
      },
    });

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Một số ghế đã được đặt, vui lòng chọn ghế khác" },
        { status: 400 }
      );
    }

    const seatPrices = seats.map((s) => ({
      seat_id: Number(s.seat_id),
      price: Number(s.price) || 65000,
    }));
    const ticketSubtotal = seatPrices.reduce((sum, s) => sum + s.price, 0);

    let concessionSubtotal = 0;
    const concessionItems = [];

    if (concessions && concessions.length > 0) {
      for (const item of concessions) {
        const concessionId = Number(item.concession_id);
        const quantity = Number(item.quantity);
        
        if (isNaN(concessionId) || isNaN(quantity) || quantity <= 0) continue;
        
        const concession = await prisma.concessions.findUnique({
          where: { id: concessionId },
        });
        if (concession) {
          const unitPrice = Number(concession.price);
          concessionSubtotal += unitPrice * quantity;
          concessionItems.push({
            concession_id: concessionId,
            quantity: quantity,
            unit_price: unitPrice,
          });
        }
      }
    }

    const subtotal = ticketSubtotal + concessionSubtotal;
    const totalAmount = subtotal;

    const booking = await prisma.bookings.create({
      data: {
        user_id: user ? BigInt(user.id) : null,
        showtime_id: showtimeIdBigInt,
        booking_code: generateBookingCode(),
        subtotal,
        discount: 0,
        total_amount: totalAmount,
        payment_method,
        payment_status: "pending",
        status: "reserved",
        booking_items: {
          create: seatPrices.map((s) => ({
            seat_id: s.seat_id,
            seat_price: s.price,
          })),
        },
        booking_concessions: {
          create: concessionItems,
        },
      },
      include: {
        booking_items: {
          include: { seat: true },
        },
        booking_concessions: {
          include: { concession: true },
        },
        showtime: {
          include: {
            movie: true,
            screen: { include: { branch: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: Number(booking.id),
        booking_code: booking.booking_code,
        total_amount: Number(booking.total_amount),
        status: booking.status,
        payment_status: booking.payment_status,
        seats: booking.booking_items.map((item) => item.seat.seat_code),
        movie: booking.showtime.movie.title,
        branch: booking.showtime.screen.branch.name,
        screen: booking.showtime.screen.name,
        showtime: booking.showtime.start_time,
      },
    });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Lỗi server: " + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const bookings = await prisma.bookings.findMany({
      where: { user_id: BigInt(user.id) },
      include: {
        booking_items: {
          include: { seat: true },
        },
        showtime: {
          include: {
            movie: true,
            screen: { include: { branch: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: Number(b.id),
        booking_code: b.booking_code,
        total_amount: Number(b.total_amount),
        status: b.status,
        payment_status: b.payment_status,
        created_at: b.created_at,
        seats: b.booking_items.map((item) => item.seat.seat_code),
        movie: b.showtime.movie.title,
        poster: b.showtime.movie.poster_url,
        branch: b.showtime.screen.branch.name,
        screen: b.showtime.screen.name,
        showtime: b.showtime.start_time,
      })),
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
