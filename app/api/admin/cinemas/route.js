import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await prisma.branches.findMany({
      include: {
        screens: {
          include: {
            _count: { select: { seats: true, showtimes: true } }
          }
        }
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({
      data: branches.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        hotline: b.hotline,
        status: b.status,
        screens: b.screens.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          seat_rows: s.seat_rows,
          seat_cols: s.seat_cols,
          totalSeats: s._count.seats,
          totalShowtimes: s._count.showtimes
        })),
        totalScreens: b.screens.length,
        totalSeats: b.screens.reduce((sum, s) => sum + s._count.seats, 0)
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/cinemas error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city, hotline } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên rạp là bắt buộc" }, { status: 400 });
    }

    const branch = await prisma.branches.create({
      data: { name, address, city, hotline }
    });

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/cinemas error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
