import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movies = await prisma.movies.findMany({
      where: {
        is_featured: true,
        status: { in: ["now_showing", "coming_soon"] }
      },
      orderBy: { release_date: "desc" },
      take: 5
    });

    return NextResponse.json({
      movies: movies.map(m => ({
        id: Number(m.id),
        title: m.title,
        poster_url: m.poster_url,
        backdrop_url: m.backdrop_url,
        rating: m.rating
      }))
    });
  } catch (error) {
    console.error("GET /api/movies/featured error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}








