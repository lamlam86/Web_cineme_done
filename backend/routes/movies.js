import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Helper function to map movie
function mapMovie(movie) {
  return {
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
    poster_url: movie.poster_url || "/assets/images/phim1.png",
    backdrop_url: movie.backdrop_url,
    trailer_url: movie.trailer_url,
    status: movie.status,
    release_date: movie.release_date,
    is_featured: movie.is_featured,
  };
}

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const { status, featured } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (featured === 'true') {
      where.is_featured = true;
    }

    const movies = await prisma.movies.findMany({
      where,
      orderBy: [
        { is_featured: 'desc' },
        { release_date: 'desc' },
      ],
    });

    res.json({
      movies: movies.map(mapMovie),
    });
  } catch (error) {
    console.error("GET /api/movies error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await prisma.movies.findUnique({
      where: { id: BigInt(id) },
    });

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim" });
    }

    res.json({ movie: mapMovie(movie) });
  } catch (error) {
    console.error("GET /api/movies/:id error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;





