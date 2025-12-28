import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST - Khách xác nhận đã chuyển khoản
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const { booking_id, transaction_id } = await request.json();

    if (!booking_id && !transaction_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin booking hoặc transaction" },
        { status: 400 }
      );
    }

    // Tìm payment record
    let payment;
    if (transaction_id) {
      payment = await prisma.payments.findFirst({
        where: { transaction_id },
        include: { booking: true }
      });
    } else {
      payment = await prisma.payments.findFirst({
        where: { 
          booking_id: BigInt(booking_id),
          status: "pending"
        },
        include: { booking: true }
      });
    }

    if (!payment) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin thanh toán" },
        { status: 404 }
      );
    }

    // Kiểm tra xem booking có thuộc về user này không (nếu đã đăng nhập)
    if (user && payment.booking.user_id && payment.booking.user_id !== BigInt(user.id)) {
      return NextResponse.json(
        { error: "Bạn không có quyền xác nhận đơn hàng này" },
        { status: 403 }
      );
    }

    // Kiểm tra hết hạn
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: "Mã QR đã hết hạn, vui lòng tạo đơn hàng mới"
      }, { status: 400 });
    }

    // Cập nhật booking - đánh dấu khách đã xác nhận chuyển khoản
    // Chuyển status thành "pending_confirmation" để admin biết cần kiểm tra
    await prisma.bookings.update({
      where: { id: payment.booking_id },
      data: {
        status: "pending_confirmation", // Chờ admin xác nhận
        // Lưu thời gian khách xác nhận
        updated_at: new Date()
      }
    });

    // Cập nhật payment - đánh dấu khách đã báo chuyển khoản
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        // Có thể thêm field customer_confirmed_at nếu cần
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Đã ghi nhận xác nhận chuyển khoản. Nhân viên sẽ kiểm tra và cập nhật đơn hàng của bạn.",
      booking_code: payment.booking.booking_code
    });

  } catch (error) {
    console.error("POST /api/payments/confirm-transfer error:", error);
    return NextResponse.json(
      { error: "Lỗi xác nhận thanh toán: " + error.message },
      { status: 500 }
    );
  }
}

