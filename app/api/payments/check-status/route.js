import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// API để kiểm tra trạng thái thanh toán (được gọi bởi cron job hoặc client)
export async function POST(request) {
  try {
    const body = await request.json();
    const { transaction_id, booking_id } = body;

    if (!transaction_id && !booking_id) {
      return NextResponse.json(
        { error: "Thiếu transaction_id hoặc booking_id" },
        { status: 400 }
      );
    }

    // Build where condition properly
    const whereCondition = {};
    if (transaction_id) {
      whereCondition.transaction_id = transaction_id;
    } else if (booking_id) {
      whereCondition.booking_id = BigInt(booking_id);
    }

    // Tìm payment
    const payment = await prisma.payments.findFirst({
      where: whereCondition,
      include: {
        booking: {
          include: {
            showtime: {
              include: {
                movie: true,
                screen: { include: { branch: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Không tìm thấy giao dịch" },
        { status: 404 }
      );
    }

    // Nếu đã thanh toán rồi, trả về luôn
    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        status: "paid",
        payment: {
          id: payment.id.toString(),
          transaction_id: payment.transaction_id,
          status: payment.status,
          paid_at: payment.paid_at,
        },
        booking: {
          id: payment.booking.id.toString(),
          booking_code: payment.booking.booking_code,
          status: payment.booking.status,
        },
      });
    }

    // Kiểm tra hết hạn
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      if (payment.status === "pending") {
        await prisma.payments.update({
          where: { id: payment.id },
          data: { status: "failed" },
        });
      }
      return NextResponse.json({
        success: true,
        status: "expired",
        message: "Mã QR đã hết hạn",
      });
    }

    // TODO: Tích hợp với API ngân hàng để kiểm tra thực tế
    // Ở đây tôi sẽ mô phỏng bằng cách kiểm tra một số điều kiện
    // Trong thực tế, bạn cần gọi API của ngân hàng với transaction_id
    
    // Mô phỏng: Kiểm tra xem có giao dịch nào khớp không
    // Trong thực tế, bạn sẽ gọi API ngân hàng như:
    // const bankResponse = await checkBankTransaction(payment.transaction_id);
    
    // Tạm thời trả về pending
    return NextResponse.json({
      success: true,
      status: "pending",
      payment: {
        id: payment.id.toString(),
        transaction_id: payment.transaction_id,
        status: payment.status,
        expires_at: payment.expires_at,
      },
      booking: {
        id: payment.booking.id.toString(),
        booking_code: payment.booking.booking_code,
        status: payment.booking.status,
      },
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Lỗi kiểm tra trạng thái thanh toán" },
      { status: 500 }
    );
  }
}

// Hàm để xác nhận thanh toán thành công (được gọi bởi cron job hoặc webhook)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { transaction_id, booking_id } = body;

    if (!transaction_id && !booking_id) {
      return NextResponse.json(
        { error: "Thiếu transaction_id hoặc booking_id" },
        { status: 400 }
      );
    }

    // Build where condition properly
    const whereCondition = { status: "pending" };
    if (transaction_id) {
      whereCondition.transaction_id = transaction_id;
    } else if (booking_id) {
      whereCondition.booking_id = BigInt(booking_id);
    }

    // Tìm payment
    const payment = await prisma.payments.findFirst({
      where: whereCondition,
      include: {
        booking: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Không tìm thấy giao dịch hoặc đã được xử lý" },
        { status: 404 }
      );
    }

    // Cập nhật payment status
    const now = new Date();
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paid_at: now,
      },
    });

    // Cập nhật booking status
    const updatedBooking = await prisma.bookings.update({
      where: { id: payment.booking_id },
      data: {
        payment_status: "paid",
        status: "confirmed",
        paid_at: now,
      },
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

    // Tự động gửi email vé với QR code
    try {
      const { sendTicketEmail } = await import("@/lib/email");
      
      const bookingData = {
        id: Number(updatedBooking.id),
        booking_code: updatedBooking.booking_code,
        movie: updatedBooking.showtime.movie.title,
        branch: updatedBooking.showtime.screen.branch.name,
        screen: updatedBooking.showtime.screen.name,
        showtime: updatedBooking.showtime.start_time,
        seats: updatedBooking.booking_items.map((item) => item.seat.seat_code),
        total_amount: Number(updatedBooking.total_amount),
        payment_method: updatedBooking.payment_method,
      };

      const emailResult = await sendTicketEmail(
        bookingData,
        updatedBooking.user?.email || "",
        updatedBooking.user?.full_name || ""
      );

      // Cập nhật booking với QR code
      await prisma.bookings.update({
        where: { id: payment.booking_id },
        data: {
          ticket_qr_code: emailResult.qrCode,
          email_sent: true,
          email_sent_at: new Date(),
        },
      });
    } catch (emailError) {
      console.error("Error sending ticket email after payment:", emailError);
      // Không throw error, chỉ log vì payment đã thành công
    }

    return NextResponse.json({
      success: true,
      message: "Thanh toán thành công",
      payment: {
        id: payment.id.toString(),
        transaction_id: payment.transaction_id,
        status: "paid",
        paid_at: now.toISOString(),
      },
      booking: {
        id: updatedBooking.id.toString(),
        booking_code: updatedBooking.booking_code,
        status: "confirmed",
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Lỗi xác nhận thanh toán" },
      { status: 500 }
    );
  }
}

