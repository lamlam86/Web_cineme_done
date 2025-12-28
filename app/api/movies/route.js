import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toISODate = (value) => (value ? value.toISOString().split('T')[0] : '');

async function mapMovie(movie) {
  const soldTickets = await prisma.booking_items.count({
    where: {
      booking: {
        showtime: {
          movie_id: movie.id,
        },
      },
    },
  });

  return {
    id: Number(movie.id),
    title: movie.title,
    slug: movie.slug,
    poster: movie.poster_url || null,
    backdrop: movie.backdrop_url || null,
    trailer: movie.trailer_url,
    synopsis: movie.synopsis,
    genres: movie.genres,
    language: movie.language,
    country: movie.country,
    director: movie.director,
    cast: movie.cast,
    status: movie.status,
    releaseDate: toISODate(movie.release_date),
    duration: movie.duration_minutes ?? 0,
    rating: movie.rating ?? '',
    isFeatured: movie.is_featured,
    totalShows: movie._count?.showtimes ?? 0,
    soldTickets,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');

    const movies = await prisma.movies.findMany({
      where: {
        ...(q ? { title: { contains: q } } : {}),
        ...(status && status !== 'all' ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { showtimes: true } },
      },
    });

    const data = await Promise.all(movies.map(mapMovie));
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/movies failed', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const errors = [];
    if (!body.title?.trim()) errors.push('Tiêu đề');
    if (!body.status) errors.push('Trạng thái');
    if (!body.poster?.trim()) errors.push('Poster URL');
    if (!body.genres?.trim()) errors.push('Thể loại');
    if (!body.synopsis?.trim()) errors.push('Mô tả');
    if (!body.duration || body.duration < 1) errors.push('Thời lượng');
    if (!body.releaseDate) errors.push('Ngày phát hành');
    
    if (errors.length > 0) {
      return NextResponse.json({ error: `Vui lòng điền: ${errors.join(', ')}` }, { status: 400 });
    }

    // Check if movie with same title already exists
    const existingMovie = await prisma.movies.findFirst({
      where: { title: body.title.trim() }
    });

    if (existingMovie) {
      return NextResponse.json({ error: 'Phim với tiêu đề này đã tồn tại!' }, { status: 400 });
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists, append number if needed
    let finalSlug = slug;
    let slugCount = 1;
    while (await prisma.movies.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${slugCount}`;
      slugCount++;
    }

    const movie = await prisma.movies.create({
      data: {
        title: body.title.trim(),
        slug: finalSlug,
        status: body.status,
        poster_url: body.poster ?? null,
        backdrop_url: body.backdrop ?? null,
        trailer_url: body.trailer ?? null,
        synopsis: body.synopsis ?? null,
        genres: body.genres ?? null,
        language: body.language ?? null,
        country: body.country ?? null,
        director: body.director ?? null,
        cast: body.cast ?? null,
        release_date: body.releaseDate ? new Date(body.releaseDate) : null,
        duration_minutes: body.duration ?? null,
        rating: body.rating ?? null,
        is_featured: body.isFeatured ?? false,
      },
      include: {
        _count: { select: { showtimes: true } },
      },
    });

    const data = await mapMovie(movie);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/movies failed', error);
    return NextResponse.json({ error: 'Không thể tạo phim mới.' }, { status: 500 });
  }
}

