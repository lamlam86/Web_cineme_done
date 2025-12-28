import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách đơn hàng
export async function GET(request) {
  try {
    // Check authentication - only admin and staff can access
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    let where = {};
    
    if (status && status !== "all") {
      where.payment_status = status;
    }
    
    // Ẩn các đơn hàng đang chờ thanh toán QR (bank_transfer) mà chưa xác nhận
    // Chỉ hiển thị khi: 
    // - Không phải bank_transfer, HOẶC
    // - Là bank_transfer nhưng đã thanh toán (paid) hoặc đã xác nhận (confirmed)
    // - Là bank_transfer và khách đã bấm xác nhận (pending_confirmation)
    if (!status || status === "all" || status === "pending") {
      where = {
        ...where,
        OR: [
          // Đơn hàng không phải chuyển khoản - hiển thị tất cả
          { payment_method: { not: "bank_transfer" } },
          // Đơn hàng chuyển khoản đã thanh toán
          { 
            payment_method: "bank_transfer",
            payment_status: { in: ["paid", "failed", "refunded"] }
          },
          // Đơn hàng chuyển khoản đã được xác nhận (khách đã bấm "Tôi đã chuyển khoản")
          {
            payment_method: "bank_transfer",
            status: { in: ["confirmed", "pending_confirmation"] }
          }
        ]
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.bookings.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          showtime: {
            include: {
              movie: { select: { title: true, poster_url: true } },
              screen: { include: { branch: { select: { name: true } } } }
            }
          },
          booking_items: { include: { seat: true } },
          booking_concessions: { include: { concession: true } }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.bookings.count({ where })
    ]);

    return NextResponse.json({
      data: bookings.map(b => ({
        id: Number(b.id),
        booking_code: b.booking_code,
        user: b.user ? { id: Number(b.user.id), name: b.user.full_name, email: b.user.email } : null,
        movie: b.showtime.movie.title,
        movie_poster: b.showtime.movie.poster_url,
        branch: b.showtime.screen.branch.name,
        screen: b.showtime.screen.name,
        showtime: b.showtime.start_time,
        seats: b.booking_items.map(i => i.seat.seat_code),
        concessions: b.booking_concessions.map(c => ({
          name: c.concession.name,
          quantity: c.quantity,
          price: Number(c.unit_price)
        })),
        subtotal: Number(b.subtotal),
        discount: Number(b.discount || 0),
        total_amount: Number(b.total_amount),
        payment_method: b.payment_method,
        payment_status: b.payment_status,
        status: b.status,
        created_at: b.created_at
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}







