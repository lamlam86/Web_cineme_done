"use client";
import { useState, useEffect, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MoviePoster from "@/components/MoviePoster";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState({ movies: [], branches: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults({ movies: [], branches: [] });
      return;
    }

    async function search() {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          movies: data.movies || [],
          branches: data.branches || []
        });
      } catch (err) {
        console.error(err);
        setResults({ movies: [], branches: [] });
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [query]);

  const movies = results.movies || [];
  const branches = results.branches || [];
  const totalResults = movies.length + branches.length;

  return (
    <div className="container">
      <h1 className="page-title">KẾT QUẢ TÌM KIẾM</h1>
      
      {query && (
        <p className="search-query">
          Tìm kiếm cho: <strong>&quot;{query}&quot;</strong>
          {!loading && ` - ${totalResults} kết quả`}
        </p>
      )}

      {loading ? (
        <div className="loading-state">Đang tìm kiếm...</div>
      ) : totalResults > 0 ? (
        <div className="search-results">
          {/* Movies */}
          {movies.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
                Phim ({movies.length})
              </h2>
              <div className="search-movies">
                {movies.map(movie => (
                  <Link key={movie.id} href={`/movie/${movie.id}`} className="search-movie-card">
                    <MoviePoster 
                      poster_url={movie.poster_url} 
                      title={movie.title}
                      className="search-movie-card__poster"
                    />
                    <div className="search-movie-card__info">
                      <h3>{movie.title}</h3>
                      <p>{movie.genres}</p>
                      <span className={`search-movie-card__status search-movie-card__status--${movie.status}`}>
                        {movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Branches */}
          {branches.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Rạp ({branches.length})
              </h2>
              <div className="search-branches">
                {branches.map(branch => (
                  <Link key={branch.id} href={`/lich-chieu?branch=${branch.id}`} className="search-branch-card">
                    <div className="search-branch-card__icon">🎬</div>
                    <div className="search-branch-card__info">
                      <h3>{branch.name}</h3>
                      <p>{branch.address}</p>
                      <span>{branch.city}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : query ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h3>Không tìm thấy kết quả</h3>
          <p>Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">🎬</div>
          <h3>Tìm kiếm phim, rạp</h3>
          <p>Nhập từ khóa vào ô tìm kiếm ở trên</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="app">
      <Header />
      <main className="search-page">
        <Suspense fallback={<div className="container"><div className="loading-state">Đang tải...</div></div>}>
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

