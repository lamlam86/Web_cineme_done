import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Lấy danh sách suất chiếu
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movie_id");
    const branchId = searchParams.get("branch_id");
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {
      ...(movieId && { movie_id: BigInt(movieId) }),
      ...(branchId && { screen: { branch_id: parseInt(branchId) } }),
      ...(date && {
        start_time: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
      })
    };

    const [showtimes, total] = await Promise.all([
      prisma.showtimes.findMany({
        where,
        include: {
          movie: { select: { id: true, title: true, poster_url: true, duration_minutes: true } },
          screen: { include: { branch: { select: { id: true, name: true } } } },
          _count: { select: { bookings: true } }
        },
        orderBy: { start_time: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.showtimes.count({ where })
    ]);

    const response = NextResponse.json({
      data: showtimes.map(s => ({
        id: Number(s.id),
        movie: { id: Number(s.movie.id), title: s.movie.title, poster_url: s.movie.poster_url, duration: s.movie.duration_minutes },
        screen: { id: s.screen.id, name: s.screen.name, type: s.screen.type },
        branch: { id: s.screen.branch.id, name: s.screen.branch.name },
        start_time: s.start_time,
        end_time: s.end_time,
        language: s.language,
        subtitle: s.subtitle,
        status: s.status,
        bookings_count: s._count.bookings
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error("GET /api/admin/showtimes error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo suất chiếu mới
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { movie_id, screen_id, start_time, language, subtitle } = body;

    if (!movie_id || !screen_id || !start_time) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Get movie duration to calculate end_time
    const movie = await prisma.movies.findUnique({ where: { id: BigInt(movie_id) } });
    if (!movie) {
      return NextResponse.json({ error: "Phim không tồn tại" }, { status: 404 });
    }

    // Parse datetime-local format
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Thời gian không hợp lệ" }, { status: 400 });
    }
    
    const endDate = new Date(startDate.getTime() + (movie.duration_minutes || 120) * 60 * 1000);

    const showtime = await prisma.showtimes.create({
      data: {
        movie_id: BigInt(movie_id),
        screen_id: parseInt(screen_id),
        start_time: startDate,
        end_time: endDate,
        language: language || null,
        subtitle: subtitle || null,
        status: "selling"
      },
      include: {
        movie: { select: { title: true } },
        screen: { include: { branch: { select: { name: true } } } }
      }
    });

    return NextResponse.json({ 
      data: {
        id: Number(showtime.id),
        movie: showtime.movie.title,
        screen: showtime.screen.name,
        branch: showtime.screen.branch.name,
        start_time: showtime.start_time,
        end_time: showtime.end_time
      },
      message: "Tạo suất chiếu thành công!"
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/showtimes error:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
