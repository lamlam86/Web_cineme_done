import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Lấy thông tin vé theo booking code
export async function GET(request, { params }) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: "Thiếu mã vé" },
        { status: 400 }
      );
    }

    // Tìm booking theo booking_code
    const booking = await prisma.bookings.findUnique({
      where: { booking_code: code },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        showtime: {
          include: {
            movie: {
              select: {
                title: true,
                poster_url: true,
                rating: true,
                duration: true,
              },
            },
            screen: {
              include: {
                branch: {
                  select: {
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        booking_items: {
          include: {
            seat: true,
          },
        },
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Không tìm thấy vé với mã này" },
        { status: 404 }
      );
    }

    // Format response
    const ticket = {
      id: Number(booking.id),
      booking_code: booking.booking_code,
      movie: booking.showtime.movie.title,
      poster: booking.showtime.movie.poster_url,
      rating: booking.showtime.movie.rating,
      duration: booking.showtime.movie.duration,
      branch: booking.showtime.screen.branch.name,
      branch_address: booking.showtime.screen.branch.address,
      screen: booking.showtime.screen.name,
      showtime: booking.showtime.start_time,
      seats: booking.booking_items.map((item) => item.seat.seat_code),
      seat_details: booking.booking_items.map((item) => ({
        code: item.seat.seat_code,
        type: item.seat.seat_type,
        price: Number(item.seat_price),
      })),
      concessions: booking.booking_concessions.map((c) => ({
        name: c.concession.name,
        quantity: c.quantity,
        price: Number(c.unit_price),
      })),
      subtotal: Number(booking.subtotal),
      discount: Number(booking.discount || 0),
      total_amount: Number(booking.total_amount),
      payment_method: booking.payment_method,
      payment_status: booking.payment_status,
      status: booking.status,
      created_at: booking.created_at,
      customer: booking.user ? {
        name: booking.user.full_name,
        email: booking.user.email,
      } : null,
    };

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("GET /api/ticket/[code] error:", error);
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}
