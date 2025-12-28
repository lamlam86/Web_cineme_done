import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendTicketEmail } from "@/lib/email";

// POST - Gửi email vé với QR code
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "Thiếu booking_id" },
        { status: 400 }
      );
    }

    // Lấy thông tin booking
    const booking = await prisma.bookings.findUnique({
      where: { id: BigInt(booking_id) },
      include: {
        user: true,
        booking_items: {
          include: { seat: true },
        },
        booking_concessions: {
          include: { concession: true },
        },
        showtime: {
          include: {
            movie: true,
            screen: {
              include: { branch: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn đặt vé" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập
    if (booking.user_id && Number(booking.user_id) !== user.id) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    // Kiểm tra đã thanh toán chưa
    if (booking.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Vé chưa được thanh toán" },
        { status: 400 }
      );
    }

    // Kiểm tra đã gửi email chưa
    if (booking.email_sent && booking.ticket_qr_code) {
      return NextResponse.json({
        success: true,
        message: "Email đã được gửi trước đó",
        qr_code: booking.ticket_qr_code,
      });
    }

    // Chuẩn bị dữ liệu booking cho email
    const bookingData = {
      id: Number(booking.id),
      booking_code: booking.booking_code,
      movie: booking.showtime.movie.title,
      branch: booking.showtime.screen.branch.name,
      screen: booking.showtime.screen.name,
      showtime: booking.showtime.start_time,
      seats: booking.booking_items.map((item) => item.seat.seat_code),
      total_amount: Number(booking.total_amount),
      payment_method: booking.payment_method,
    };

    // Gửi email
    const emailResult = await sendTicketEmail(
      bookingData,
      booking.user?.email || user.email,
      booking.user?.full_name || user.fullName
    );

    // Cập nhật booking với QR code và trạng thái email
    await prisma.bookings.update({
      where: { id: BigInt(booking_id) },
      data: {
        ticket_qr_code: emailResult.qrCode,
        email_sent: true,
        email_sent_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email đã được gửi thành công",
      qr_code: emailResult.qrCode,
    });
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return NextResponse.json(
      { error: "Lỗi gửi email vé" },
      { status: 500 }
    );
  }
}





