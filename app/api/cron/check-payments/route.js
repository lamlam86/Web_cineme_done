import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron job để kiểm tra thanh toán tự động
// Có thể gọi từ: Vercel Cron, GitHub Actions, hoặc external cron service
export async function GET(request) {
  try {
    // Kiểm tra API key để bảo mật (nếu gọi từ external)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lấy tất cả payments đang pending và chưa hết hạn
    const pendingPayments = await prisma.payments.findMany({
      where: {
        status: "pending",
        expires_at: {
          gte: new Date(), // Chưa hết hạn
        },
      },
      include: {
        booking: true,
      },
      take: 100, // Giới hạn để tránh quá tải
    });

    console.log(`Checking ${pendingPayments.length} pending payments...`);

    let confirmedCount = 0;
    let failedCount = 0;

    for (const payment of pendingPayments) {
      try {
        // TODO: Tích hợp với API ngân hàng thực tế
        // Ví dụ: const bankResponse = await checkBankTransaction(payment.transaction_id);
        
        // Mô phỏng: Kiểm tra xem có giao dịch thành công không
        // Trong thực tế, bạn sẽ gọi API của ngân hàng:
        // - VietQR API
        // - Ngân hàng API (ACB, Vietcombank, etc.)
        // - Payment gateway API
        
        // Tạm thời: Mô phỏng bằng cách kiểm tra một số điều kiện
        // Bạn có thể thay thế bằng logic thực tế:
        const isPaid = await checkBankPayment(payment);
        
        if (isPaid) {
          // Xác nhận thanh toán thành công
          const now = new Date();
          
          await prisma.payments.update({
            where: { id: payment.id },
            data: {
              status: "paid",
              paid_at: now,
            },
          });

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

          // Gửi email vé tự động
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

            console.log(`Ticket email sent for booking ${updatedBooking.booking_code}`);
          } catch (emailError) {
            console.error(`Error sending ticket email for booking ${payment.booking_id}:`, emailError);
          }

          confirmedCount++;
          console.log(`Payment ${payment.transaction_id} confirmed`);
        } else {
          // Kiểm tra xem có hết hạn không
          if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
            await prisma.payments.update({
              where: { id: payment.id },
              data: { status: "failed" },
            });
            failedCount++;
            console.log(`Payment ${payment.transaction_id} expired`);
          }
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.transaction_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingPayments.length} payments`,
      confirmed: confirmedCount,
      failed: failedCount,
      pending: pendingPayments.length - confirmedCount - failedCount,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Lỗi cron job" },
      { status: 500 }
    );
  }
}

// Hàm mô phỏng kiểm tra thanh toán từ ngân hàng
// Trong thực tế, bạn sẽ thay thế bằng API call thực tế
async function checkBankPayment(payment) {
  // TODO: Tích hợp với API ngân hàng thực tế
  // Ví dụ với VietQR:
  // const response = await fetch(`https://api.vietqr.io/v2/transaction/${payment.transaction_id}`, {
  //   headers: { 'x-api-key': process.env.VIETQR_API_KEY }
  // });
  // const data = await response.json();
  // return data.status === 'success';
  
  // Tạm thời: Mô phỏng - trong thực tế bạn sẽ gọi API ngân hàng
  // Có thể kiểm tra:
  // 1. VietQR API
  // 2. Ngân hàng API (ACB, Vietcombank, etc.)
  // 3. Payment gateway (VNPay, MoMo, etc.)
  
  // Mô phỏng: Trả về false (chưa thanh toán)
  // Trong thực tế, bạn sẽ gọi API ngân hàng để kiểm tra
  return false;
}

