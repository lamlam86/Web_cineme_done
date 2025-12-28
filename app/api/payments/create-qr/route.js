import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Tạo mã QR thanh toán ngân hàng
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
        showtime: {
          include: {
            movie: true,
            screen: { include: { branch: true } },
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

    // Kiểm tra quyền truy cập - so sánh đúng kiểu BigInt
    if (booking.user_id && Number(booking.user_id) !== Number(user.id)) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    // Kiểm tra đã thanh toán chưa
    if (booking.payment_status === "paid") {
      return NextResponse.json(
        { error: "Đơn hàng đã được thanh toán" },
        { status: 400 }
      );
    }

    // Tạo transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Thông tin tài khoản ngân hàng (có thể lấy từ env hoặc database)
    const bankAccount = process.env.BANK_ACCOUNT || "0123456789";
    const bankName = process.env.BANK_NAME || "Ngân hàng TMCP Á Châu (ACB)";
    const accountName = process.env.ACCOUNT_NAME || "LMK CINEMA";
    const bankBin = process.env.BANK_BIN || "970416"; // ACB bank BIN

    const amount = Number(booking.total_amount);
    const addInfo = `LMK${booking.booking_code}`;

    // Tạo QR code sử dụng VietQR API (img.vietqr.io)
    // Format: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={DESCRIPTION}&accountName={NAME}
    const qrCodeImage = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

    // Thời gian hết hạn: 10 phút
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Kiểm tra xem đã có payment record chưa
    const existingPayment = await prisma.payments.findFirst({
      where: {
        booking_id: BigInt(booking_id),
        status: "pending",
      },
    });

    let payment;
    if (existingPayment) {
      // Cập nhật payment record hiện có
      payment = await prisma.payments.update({
        where: { id: existingPayment.id },
        data: {
          transaction_id: transactionId,
          qr_code: qrCodeImage,
          qr_data: addInfo,
          expires_at: expiresAt,
        },
      });
    } else {
      // Tạo payment record mới
      payment = await prisma.payments.create({
        data: {
          booking_id: BigInt(booking_id),
          transaction_id: transactionId,
          amount: booking.total_amount,
          bank_account: bankAccount,
          bank_name: bankName,
          qr_code: qrCodeImage,
          qr_data: addInfo,
          payment_method: "bank_transfer",
          status: "pending",
          expires_at: expiresAt,
        },
      });
    }

    // Cập nhật booking
    await prisma.bookings.update({
      where: { id: BigInt(booking_id) },
      data: {
        transaction_id: transactionId,
        qr_code: qrCodeImage,
        qr_expires_at: expiresAt,
        payment_method: "bank_transfer",
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id.toString(),
        transaction_id: transactionId,
        qr_code: qrCodeImage,
        qr_data: addInfo,
        amount: amount,
        bank_account: bankAccount,
        bank_name: bankName,
        account_name: accountName,
        expires_at: expiresAt.toISOString(),
        booking_code: booking.booking_code,
      },
    });
  } catch (error) {
    console.error("Error creating QR code:", error);
    return NextResponse.json(
      { error: "Lỗi tạo mã QR thanh toán: " + error.message },
      { status: 500 }
    );
  }
}





