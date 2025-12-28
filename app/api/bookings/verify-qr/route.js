import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST - Verify QR code tại rạp (dành cho staff/admin)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Chỉ staff và admin mới được verify
    if (!user.roles?.includes("admin") && !user.roles?.includes("staff")) {
      return NextResponse.json(
        { error: "Forbidden - Chỉ nhân viên mới được quét QR" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qr_data } = body;

    if (!qr_data) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu QR code" },
        { status: 400 }
      );
    }

    // Parse QR data
    let qrInfo;
    try {
      qrInfo = JSON.parse(qr_data);
    } catch {
      // Nếu không phải JSON, có thể là booking_code trực tiếp
      qrInfo = { booking_code: qr_data };
    }

    // Tìm booking
    const booking = await prisma.bookings.findUnique({
      where: {
        booking_code: qrInfo.booking_code || qr_data,
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

    if (!booking) {
      return NextResponse.json(
        { error: "Không tìm thấy vé", valid: false },
        { status: 404 }
      );
    }

    // Helper để tạo booking info chi tiết
    const getBookingInfo = () => ({
      id: Number(booking.id),
      booking_code: booking.booking_code,
      movie: booking.showtime?.movie?.title || "N/A",
      branch: booking.showtime?.screen?.branch?.name || "N/A",
      screen: booking.showtime?.screen?.name || "N/A",
      showtime: booking.showtime?.start_time,
      seats: booking.booking_items?.map((item) => item.seat?.seat_code) || [],
      customer_name: booking.user?.full_name || "Khách vãng lai",
      customer_email: booking.user?.email || null,
      total_amount: Number(booking.total_amount),
      payment_status: booking.payment_status,
      status: booking.status,
    });

    // Kiểm tra trạng thái
    if (booking.payment_status !== "paid") {
      return NextResponse.json({
        valid: false,
        error: "Vé chưa được thanh toán",
        booking: getBookingInfo(),
      });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({
        valid: false,
        error: "Vé đã bị hủy",
        booking: getBookingInfo(),
      });
    }

    // Kiểm tra thời gian (có thể quét trước 30 phút)
    const showtime = new Date(booking.showtime.start_time);
    const now = new Date();
    const timeDiff = showtime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < -30) {
      // Đã quá 30 phút sau giờ chiếu
      return NextResponse.json({
        valid: false,
        error: "Vé đã hết hạn (quá 30 phút sau giờ chiếu)",
        booking: getBookingInfo(),
      });
    }

    if (minutesDiff > 60) {
      // Còn quá sớm (hơn 60 phút trước giờ chiếu)
      return NextResponse.json({
        valid: false,
        error: `Còn quá sớm (${Math.round(minutesDiff)} phút trước giờ chiếu)`,
        booking: getBookingInfo(),
      });
    }

    // Vé hợp lệ - trả về thông tin
    return NextResponse.json({
      valid: true,
      message: "Vé hợp lệ",
      booking: {
        id: Number(booking.id),
        booking_code: booking.booking_code,
        movie: booking.showtime.movie.title,
        branch: booking.showtime.screen.branch.name,
        screen: booking.showtime.screen.name,
        showtime: booking.showtime.start_time,
        seats: booking.booking_items.map((item) => item.seat.seat_code),
        customer_name: booking.user?.full_name || "Khách vãng lai",
        customer_email: booking.user?.email || null,
        total_amount: Number(booking.total_amount),
        payment_method: booking.payment_method,
        created_at: booking.created_at,
      },
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return NextResponse.json(
      { error: "Lỗi xác thực QR code" },
      { status: 500 }
    );
  }
}





