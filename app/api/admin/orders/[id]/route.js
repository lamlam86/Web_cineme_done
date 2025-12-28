import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendTicketEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

// PATCH - Cập nhật đơn hàng
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { payment_status, status, payment_method, notes } = body;

    // Lấy booking hiện tại để kiểm tra trạng thái trước khi update
    const currentBooking = await prisma.bookings.findUnique({
      where: { id: BigInt(id) },
      select: { payment_status: true, email_sent: true }
    });

    // Build update data
    const updateData = {};
    let shouldSendEmail = false;
    
    if (payment_status) {
      updateData.payment_status = payment_status;
      // Auto update booking status based on payment status
      if (payment_status === "paid") {
        updateData.status = "confirmed";
        updateData.paid_at = new Date();
        
        // Chỉ gửi email nếu trước đó chưa paid và chưa gửi email
        if (currentBooking?.payment_status !== "paid" && !currentBooking?.email_sent) {
          shouldSendEmail = true;
        }
      } else if (payment_status === "pending") {
        updateData.status = "reserved";
        updateData.paid_at = null;
      } else if (payment_status === "refunded") {
        updateData.status = "cancelled";
      } else if (payment_status === "failed") {
        // Giữ nguyên status hoặc có thể set lại reserved
        updateData.status = "reserved";
        updateData.paid_at = null;
      }
    }
    
    // Nếu có truyền status riêng thì override
    if (status) updateData.status = status;
    if (payment_method) updateData.payment_method = payment_method;
    if (notes !== undefined) updateData.notes = notes;

    const booking = await prisma.bookings.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        user: true,
        booking_items: {
          include: { seat: true }
        },
        showtime: {
          include: {
            movie: true,
            screen: {
              include: { branch: true }
            }
          }
        }
      }
    });

    // Gửi email QR code tự động khi xác nhận thanh toán
    let emailSent = false;
    if (shouldSendEmail && booking.user?.email) {
      try {
        const bookingData = {
          id: Number(booking.id),
          booking_code: booking.booking_code,
          movie: booking.showtime.movie.title,
          branch: booking.showtime.screen.branch.name,
          screen: booking.showtime.screen.name,
          showtime: booking.showtime.start_time,
          seats: booking.booking_items.map(item => item.seat.seat_code),
          total_amount: Number(booking.total_amount),
          payment_method: booking.payment_method,
        };

        const emailResult = await sendTicketEmail(
          bookingData,
          booking.user.email,
          booking.user.full_name
        );

        // Cập nhật trạng thái đã gửi email
        if (emailResult.success) {
          await prisma.bookings.update({
            where: { id: BigInt(id) },
            data: {
              ticket_qr_code: emailResult.qrCode,
              email_sent: true,
              email_sent_at: new Date()
            }
          });
          emailSent = true;
        }
      } catch (emailError) {
        console.error("Error sending ticket email:", emailError);
        // Không throw error, vẫn tiếp tục xác nhận đơn hàng
      }
    }

    return NextResponse.json({ 
      success: true,
      data: { 
        id: Number(booking.id), 
        payment_status: booking.payment_status, 
        status: booking.status,
        payment_method: booking.payment_method
      },
      message: emailSent 
        ? "Xác nhận đơn hàng thành công! Email vé đã được gửi cho khách hàng." 
        : "Cập nhật đơn hàng thành công!",
      emailSent
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa đơn hàng (chỉ admin)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user?.roles?.includes("admin")) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền xóa đơn hàng" }, { status: 403 });
    }

    const { id } = await params;

    // Delete related items first
    await prisma.booking_concessions.deleteMany({ where: { booking_id: BigInt(id) } });
    await prisma.booking_items.deleteMany({ where: { booking_id: BigInt(id) } });
    
    // Delete booking
    await prisma.bookings.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ success: true, message: "Đã xóa đơn hàng!" });
  } catch (error) {
    console.error("DELETE /api/admin/orders/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


