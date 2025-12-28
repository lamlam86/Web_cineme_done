import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toISODate = (value) => (value ? value.toISOString().split('T')[0] : '');

const mapMovie = async (movie) => {
  const soldTickets = await prisma.booking_items.count({
    where: {
      booking: {
        showtime: { movie_id: movie.id },
      },
    },
  });

  return {
    id: movie.id,
    title: movie.title,
    poster: movie.poster_url,
    status: movie.status,
    releaseDate: toISODate(movie.release_date),
    duration: movie.duration_minutes ?? 0,
    rating: movie.rating ?? '',
    isFeatured: movie.is_featured,
    totalShows: movie._count?.showtimes ?? 0,
    soldTickets,
  };
};

// GET - Fetch single movie with full details
export async function GET(request, { params }) {
  try {
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    const movie = await prisma.movies.findUnique({
      where: { id },
      include: {
        showtimes: {
          where: {
            start_time: { gte: new Date() },
            status: { in: ["scheduled", "selling"] },
          },
          orderBy: { start_time: "asc" },
          take: 50,
          include: {
            screen: {
              include: { branch: true },
            },
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Không tìm thấy phim.' }, { status: 404 });
    }

    // Get related movies
    const relatedMovies = await prisma.movies.findMany({
      where: {
        id: { not: BigInt(id) },
        status: "now_showing",
      },
      take: 4,
      orderBy: { release_date: "desc" },
    });

    // Get unique dates
    const dates = [...new Set(
      movie.showtimes.map(st => {
        const d = new Date(st.start_time);
        return d.toLocaleDateString("vi-VN");
      })
    )].slice(0, 7);

    return NextResponse.json({
      movie: {
        id: Number(movie.id),
        title: movie.title,
        slug: movie.slug,
        synopsis: movie.synopsis,
        genres: movie.genres,
        duration_minutes: movie.duration_minutes,
        rating: movie.rating,
        language: movie.language,
        country: movie.country,
        director: movie.director,
        cast: movie.cast,
        poster_url: movie.poster_url,
        backdrop_url: movie.backdrop_url,
        trailer_url: movie.trailer_url,
        status: movie.status,
        release_date: movie.release_date,
        is_featured: movie.is_featured,
        showtimes: movie.showtimes.map(st => ({
          id: Number(st.id),
          start_time: st.start_time,
          end_time: st.end_time,
          language: st.language,
          subtitle: st.subtitle,
          status: st.status,
          screen: {
            id: st.screen.id,
            name: st.screen.name,
            type: st.screen.type,
            branch: {
              id: st.screen.branch.id,
              name: st.screen.branch.name,
              address: st.screen.branch.address,
            },
          },
        })),
      },
      relatedMovies: relatedMovies.map(m => ({
        id: Number(m.id),
        title: m.title,
        poster_url: m.poster_url,
        rating: m.rating,
      })),
      dates,
    });
  } catch (error) {
    console.error('GET /api/movies/[id] failed', error);
    return NextResponse.json({ error: 'Không thể lấy thông tin phim.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    const body = await request.json();

    // Generate slug from title if title is updated
    let slug = undefined;
    if (body.title) {
      slug = body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const movie = await prisma.movies.update({
      where: { id },
      data: {
        ...(body.title ? { title: body.title, slug } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.poster !== undefined ? { poster_url: body.poster } : {}),
        ...(body.backdrop !== undefined ? { backdrop_url: body.backdrop } : {}),
        ...(body.trailer !== undefined ? { trailer_url: body.trailer } : {}),
        ...(body.synopsis !== undefined ? { synopsis: body.synopsis } : {}),
        ...(body.genres !== undefined ? { genres: body.genres } : {}),
        ...(body.language !== undefined ? { language: body.language } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.director !== undefined ? { director: body.director } : {}),
        ...(body.cast !== undefined ? { cast: body.cast } : {}),
        ...(body.releaseDate !== undefined ? { release_date: body.releaseDate ? new Date(body.releaseDate) : null } : {}),
        ...(body.duration !== undefined ? { duration_minutes: body.duration } : {}),
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
      },
      include: {
        _count: { select: { showtimes: true } },
      },
    });

    return NextResponse.json({
      data: {
        id: Number(movie.id),
        title: movie.title,
        poster: movie.poster_url,
        status: movie.status,
        releaseDate: toISODate(movie.release_date),
        duration: movie.duration_minutes ?? 0,
        rating: movie.rating ?? '',
        totalShows: movie._count?.showtimes ?? 0,
      }
    });
  } catch (error) {
    console.error('PATCH /api/movies/[id] failed', error);
    return NextResponse.json({ error: 'Không thể cập nhật phim.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
    }

    await prisma.movies.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/movies/[id] failed', error);
    return NextResponse.json({ error: 'Không thể xóa phim.' }, { status: 500 });
  }
}

