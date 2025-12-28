import Header from "@/components/Header";
import BannerSlider from "@/components/BannerSlider";
import PromoSlider from "@/components/PromoSlider";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import MoviePoster from "@/components/MoviePoster";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getHomeData() {
  const [nowShowing, comingSoon, branches] = await Promise.all([
    prisma.movies.findMany({
      where: { status: "now_showing" },
      orderBy: [{ is_featured: "desc" }, { release_date: "desc" }],
      take: 8,
    }),
    prisma.movies.findMany({
      where: { status: "coming_soon" },
      orderBy: [{ is_featured: "desc" }, { release_date: "asc" }],
      take: 8,
    }),
    prisma.branches.findMany({
      where: { status: "active" },
      take: 6,
    }),
  ]);

  return { nowShowing, comingSoon, branches };
}

function getRatingClass(rating) {
  if (!rating) return "";
  if (rating === "P") return "P";
  if (rating.includes("13")) return "T13";
  if (rating.includes("16")) return "T16";
  if (rating.includes("18")) return "T18";
  return "";
}

export default async function HomePage() {
  const { nowShowing, comingSoon, branches } = await getHomeData();

  return (
    <div className="app">
      <Header />

      <main className="container">
        <BannerSlider />

        <section className="section">
          <div className="section-header">
            <h2 className="section-heading">PHIM ĐANG CHIẾU</h2>
           
          </div>
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
                  <Link href={`/movie/${movie.id}`} className="mv-card__btn">
                    ĐẶT VÉ
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {nowShowing.length === 0 && (
            <p className="empty-message">Chưa có phim đang chiếu</p>
          )}
          {nowShowing.length > 0 && (
            <div className="section-viewmore">
              <Link href="/movie" className="btn-viewmore">
                XEM THÊM
              </Link>
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-heading">KHUYẾN MÃI</h2>
          <PromoSlider />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-heading">SẮP CHIẾU</h2>
          </div>
          <div className="movies-grid">
            {comingSoon.map((movie) => (
              <div key={movie.id.toString()} className="mv-card mv-card--coming">
                <Link href={`/movie/${movie.id}`} className="mv-card__poster">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} />
                  ) : (
                    <div className="mv-card__no-poster">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span>Chưa có poster</span>
                    </div>
                  )}
                  
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
                          {new Date(movie.release_date).toLocaleDateString("vi-VN")}
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
          {comingSoon.length > 0 && (
            <div className="section-viewmore">
              <Link href="/movie" className="btn-viewmore">
                XEM THÊM
              </Link>
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-heading">HỆ THỐNG RẠP LMK CINEMA</h2>
          <div className="branches-grid">
            {branches.map((branch) => (
              <div key={branch.id} className="branch-card">
                <div className="branch-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h3 className="branch-card__name">{branch.name}</h3>
                <p className="branch-card__address">{branch.address}</p>
                <p className="branch-card__city">{branch.city}</p>
                {branch.hotline && (
                  <a href={`tel:${branch.hotline}`} className="branch-card__hotline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {branch.hotline}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}

