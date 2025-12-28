import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// PATCH - Cập nhật suất chiếu
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { start_time, language, subtitle, status } = body;

    const updateData = {};
    if (language !== undefined) updateData.language = language;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (status) updateData.status = status;

    if (start_time) {
      const showtime = await prisma.showtimes.findUnique({
        where: { id: BigInt(id) },
        include: { movie: true }
      });
      const startDate = new Date(start_time);
      const endDate = new Date(startDate.getTime() + (showtime.movie.duration_minutes || 120) * 60 * 1000);
      updateData.start_time = startDate;
      updateData.end_time = endDate;
    }

    const updated = await prisma.showtimes.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    return NextResponse.json({ 
      data: {
        id: Number(updated.id),
        movie_id: Number(updated.movie_id),
        screen_id: updated.screen_id,
        start_time: updated.start_time,
        end_time: updated.end_time,
        language: updated.language,
        subtitle: updated.subtitle,
        status: updated.status
      }
    });
  } catch (error) {
    console.error("PATCH /api/admin/showtimes/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa suất chiếu
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Vui lòng đăng nhập lại" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if showtime exists
    const showtime = await prisma.showtimes.findUnique({ where: { id: BigInt(id) } });
    if (!showtime) {
      return NextResponse.json({ success: true, message: "Suất chiếu đã được xóa" });
    }
    
    // Check if there are any bookings
    const bookings = await prisma.bookings.count({ where: { showtime_id: BigInt(id) } });
    if (bookings > 0) {
      return NextResponse.json({ error: `Không thể xóa - có ${bookings} đơn đặt vé` }, { status: 400 });
    }

    await prisma.showtimes.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ success: true, message: "Đã xóa suất chiếu" });
  } catch (error) {
    console.error("DELETE /api/admin/showtimes/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


