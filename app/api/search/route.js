import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ movies: [], branches: [] });
    }

    // Search movies
    const movies = await prisma.movies.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { genres: { contains: query } },
          { director: { contains: query } },
          { cast: { contains: query } },
        ],
        status: { in: ["now_showing", "coming_soon"] },
      },
      take: 10,
      orderBy: { release_date: "desc" },
    });

    // Search branches
    const branches = await prisma.branches.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { address: { contains: query } },
          { city: { contains: query } },
        ],
        status: "active",
      },
      take: 5,
    });

    return NextResponse.json({
      movies: movies.map(m => ({
        id: Number(m.id),
        title: m.title,
        poster_url: m.poster_url,
        genres: m.genres,
        status: m.status,
      })),
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
      })),
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}









