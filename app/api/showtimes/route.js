import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách suất chiếu theo phim/rạp và ngày
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch");
    const movieId = searchParams.get("movie");
    const dateStr = searchParams.get("date"); // format: dd/mm/yyyy

    // Parse date
    let startDate, endDate;
    if (dateStr) {
      const [day, month, year] = dateStr.split("/");
      startDate = new Date(Number(year), Number(month) - 1, Number(day));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Build where clause
    const where = {
      start_time: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ["scheduled", "selling"] },
    };

    // Filter by movie if provided
    if (movieId) {
      where.movie_id = BigInt(movieId);
    }

    // Filter by branch if provided
    let screenIds = null;
    if (branchId && branchId !== "all") {
      const screens = await prisma.screens.findMany({
        where: { branch_id: Number(branchId) },
        select: { id: true },
      });
      screenIds = screens.map((s) => s.id);
      where.screen_id = { in: screenIds };
    }

    // Get showtimes
    const showtimes = await prisma.showtimes.findMany({
      where,
      include: {
        movie: true,
        screen: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: [
        { screen: { branch_id: "asc" } },
        { start_time: "asc" },
      ],
    });

    return NextResponse.json({
      showtimes: showtimes.map((st) => ({
        id: Number(st.id),
        start_time: st.start_time,
        end_time: st.end_time,
        screen_id: st.screen_id,
        screen_name: st.screen.name,
        screen: {
          id: Number(st.screen.id),
          name: st.screen.name,
          type: st.screen.type,
          branch_id: Number(st.screen.branch_id),
        },
        branch: st.screen.branch ? {
          id: Number(st.screen.branch.id),
          name: st.screen.branch.name,
          address: st.screen.branch.address,
          city: st.screen.branch.city,
        } : null,
        branch_name: st.screen.branch?.name,
        movie: {
          id: Number(st.movie.id),
          title: st.movie.title,
          poster_url: st.movie.poster_url,
          duration_minutes: st.movie.duration_minutes,
          genres: st.movie.genres,
          rating: st.movie.rating,
          language: st.movie.language,
          country: st.movie.country,
        },
        status: st.status,
        language: st.language,
        subtitle: st.subtitle,
      })),
    });
  } catch (error) {
    console.error("GET /api/showtimes error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


