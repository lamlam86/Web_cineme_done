import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import MoviePoster from "@/components/MoviePoster";
import { prisma } from "@/lib/prisma";

async function getMovies() {
  const [nowShowing, comingSoon] = await Promise.all([
    prisma.movies.findMany({
      where: { status: "now_showing" },
      orderBy: [{ is_featured: "desc" }, { release_date: "desc" }],
    }),
    prisma.movies.findMany({
      where: { status: "coming_soon" },
      orderBy: [{ is_featured: "desc" }, { release_date: "asc" }],
    }),
  ]);

  return { nowShowing, comingSoon };
}

function getRatingClass(rating) {
  if (!rating) return "";
  if (rating === "P") return "P";
  if (rating.includes("13")) return "T13";
  if (rating.includes("16")) return "T16";
  if (rating.includes("18")) return "T18";
  return "";
}

export default async function MoviePage() {
  const { nowShowing, comingSoon } = await getMovies();

  return (
    <div className="app">
      <Header />
      <main className="container">
        <section className="section">
          <h2 className="section-heading">PHIM ĐANG CHIẾU</h2>
          <div className="movies-grid">
            {nowShowing.map((movie) => (
              <div key={movie.id.toString()} className="mv-card">
                <Link href={`/movie/${movie.id}`} className="mv-card__poster">
                  <MoviePoster poster_url={movie.poster_url} title={movie.title} />
                  
                  <div className="mv-card__badges">
                    <span className="mv-card__badge mv-card__badge--2d">2D</span>
                    {movie.rating && (
                      <span className={`mv-card__badge mv-card__badge--age ${getRatingClass(movie.rating)}`}>
                        {movie.rating}
                      </span>
                    )}
                  </div>

                  <div className="mv-card__info-overlay">
                    <h4 className="mv-card__info-title">
                      {movie.title} {movie.rating && `(${movie.rating})`}
                    </h4>
                    <div className="mv-card__info-list">
                      {movie.genres && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 11a9 9 0 0 1 9 9"></path>
                              <path d="M4 4a16 16 0 0 1 16 16"></path>
                              <circle cx="5" cy="19" r="1"></circle>
                            </svg>
                          </span>
                          {movie.genres.split(",")[0].trim()}
                        </div>
                      )}
                      {movie.duration_minutes && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </span>
                          {movie.duration_minutes}&apos;
                        </div>
                      )}
                      {movie.language && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          </span>
                          {movie.language.includes("Việt") ? "Việt Nam" : movie.language.split("-")[0].trim()}
                        </div>
                      )}
                      <div className="mv-card__info-item">
                        <span className="mv-card__info-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                        </span>
                        {movie.language?.includes("Phụ đề") ? "Phụ đề Việt" : "VN"}
                      </div>
                    </div>
                  </div>
                </Link>
                <h3 className="mv-card__title">
                  {movie.title} {movie.rating && `(${movie.rating})`}
                </h3>
                <div className="mv-card__actions">
                  {movie.trailer_url && (
                    <a 
                      href={movie.trailer_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mv-card__trailer"
                    >
                      <span className="mv-card__trailer-icon">▶</span>
                      Xem Trailer
                    </a>
                  )}
                  <Link href={`/movie/${movie.id}/book`} className="mv-card__btn">
                    ĐẶT VÉ
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {nowShowing.length === 0 && (
            <p className="empty-message">Chưa có phim đang chiếu</p>
          )}
        </section>

        <section className="section">
          <h2 className="section-heading">PHIM SẮP CHIẾU</h2>
          <div className="movies-grid">
            {comingSoon.map((movie) => (
              <div key={movie.id.toString()} className="mv-card mv-card--coming">
                <Link href={`/movie/${movie.id}`} className="mv-card__poster">
                  <MoviePoster poster_url={movie.poster_url} title={movie.title} />
                  
                  <div className="mv-card__badges">
                    <span className="mv-card__badge mv-card__badge--2d">2D</span>
                    {movie.rating && (
                      <span className={`mv-card__badge mv-card__badge--age ${getRatingClass(movie.rating)}`}>
                        {movie.rating}
                      </span>
                    )}
                  </div>

                  {movie.release_date && (
                    <div className="mv-card__release">
                      {new Date(movie.release_date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </div>
                  )}

                  <div className="mv-card__info-overlay">
                    <h4 className="mv-card__info-title">
                      {movie.title} {movie.rating && `(${movie.rating})`}
                    </h4>
                    <div className="mv-card__info-list">
                      {movie.genres && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 11a9 9 0 0 1 9 9"></path>
                              <path d="M4 4a16 16 0 0 1 16 16"></path>
                              <circle cx="5" cy="19" r="1"></circle>
                            </svg>
                          </span>
                          {movie.genres.split(",")[0].trim()}
                        </div>
                      )}
                      {movie.duration_minutes && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </span>
                          {movie.duration_minutes}&apos;
                        </div>
                      )}
                      {movie.release_date && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                          </span>
                          Khởi chiếu: {new Date(movie.release_date).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                      {movie.language && (
                        <div className="mv-card__info-item">
                          <span className="mv-card__info-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          </span>
                          {movie.language.includes("Việt") ? "Việt Nam" : movie.language.split("-")[0].trim()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <h3 className="mv-card__title">
                  {movie.title} {movie.rating && `(${movie.rating})`}
                </h3>
                <div className="mv-card__actions">
                  {movie.trailer_url && (
                    <a 
                      href={movie.trailer_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mv-card__trailer"
                    >
                      <span className="mv-card__trailer-icon">▶</span>
                      Xem Trailer
                    </a>
                  )}
                  <Link href={`/movie/${movie.id}`} className="mv-card__btn mv-card__btn--outline">
                    XEM CHI TIẾT
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {comingSoon.length === 0 && (
            <p className="empty-message">Chưa có phim sắp chiếu</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

