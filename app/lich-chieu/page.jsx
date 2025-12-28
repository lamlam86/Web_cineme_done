"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MoviePoster from "@/components/MoviePoster";
import Link from "next/link";

function getWeekday(dateStr) {
  const [day, month, year] = dateStr.split("/");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekdays = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return weekdays[date.getDay()];
}

function getRatingDescription(rating) {
  if (!rating) return "";
  if (rating === "P") return "P: Phim dành cho mọi đối tượng khán giả";
  if (rating.includes("13")) return "T13: Phim dành cho khán giả từ đủ 13 tuổi trở lên (13+)";
  if (rating.includes("16")) return "T16: Phim dành cho khán giả từ đủ 16 tuổi trở lên (16+)";
  if (rating.includes("18")) return "T18: Phim dành cho khán giả từ đủ 18 tuổi trở lên (18+)";
  return "";
}

export default function SchedulePage() {
  const [movies, setMovies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Generate next 7 days - use useMemo to avoid recreating on every render
  const dates = (() => {
    const today = new Date();
    const dateList = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dateList.push(date.toLocaleDateString("vi-VN"));
    }
    return dateList;
  })();

  // Set initial date
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [selectedDate, dates]);

  // Fetch movies and branches
  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesRes, branchesRes] = await Promise.all([
          fetch("/api/movies?status=now_showing"),
          fetch("/api/branches")
        ]);
        
        const moviesData = await moviesRes.json();
        const branchesData = await branchesRes.json();
        
        // API trả về { data: [...] } không phải { movies: [...] }
        const moviesList = moviesData.data || moviesData.movies || [];
        if (moviesList.length > 0) {
          setMovies(moviesList);
          setSelectedMovie(moviesList[0].id);
        }
        if (branchesData.branches) {
          setBranches(branchesData.branches);
        }
        if (!selectedDate && dates.length > 0) {
          setSelectedDate(dates[0]);
        }
        setInitialLoad(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
        setInitialLoad(false);
      }
    }
    fetchData();
  }, []);

  // Fetch showtimes when movie, branch or date changes
  useEffect(() => {
    async function fetchShowtimes() {
      // Wait for initial load to complete
      if (initialLoad) return;
      
      if (!selectedMovie || !selectedDate) {
        setShowtimes([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        let url = `/api/showtimes?movie=${selectedMovie}&date=${selectedDate}`;
        if (selectedBranch !== "all") {
          url += `&branch=${selectedBranch}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.showtimes) {
          setShowtimes(data.showtimes);
        } else {
          setShowtimes([]);
        }
      } catch (err) {
        console.error("Error fetching showtimes:", err);
        setShowtimes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchShowtimes();
  }, [selectedMovie, selectedBranch, selectedDate, initialLoad]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get selected movie details
  const currentMovie = movies.find(m => m.id === selectedMovie);

  // Group showtimes by branch and screen type
  const showtimesByBranch = showtimes.reduce((acc, st) => {
    const branchId = st.branch?.id || st.screen?.branch_id;
    const branchName = st.branch?.name || st.branch_name;
    const branchAddress = st.branch?.address || "";
    const screenType = st.screen?.type || "standard";
    const screenName = st.screen?.name || st.screen_name;
    
    if (!acc[branchId]) {
      acc[branchId] = {
        id: branchId,
        name: branchName,
        address: branchAddress,
        city: st.branch?.city || "",
        screens: {}
      };
    }
    
    if (!acc[branchId].screens[screenType]) {
      acc[branchId].screens[screenType] = {
        type: screenType,
        name: screenName,
        showtimes: []
      };
    }
    
    acc[branchId].screens[screenType].showtimes.push(st);
    return acc;
  }, {});

  const getScreenTypeLabel = (type) => {
    return "STANDARD";
  };

  return (
    <div className="app">
      <Header />
      <main className="schedule-page-new">
        <div className="container">
          <h1 className="schedule-page-title">SUẤT CHIẾU</h1>

          {/* Filter Dropdowns */}
          <div className="schedule-filters">
            <div className="schedule-filter-item">
              <div className="schedule-filter-number">1.</div>
              <div className="schedule-filter-content">
                <label>NGÀY</label>
                <select 
                  className="schedule-filter-select"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {dates.map((date) => {
                    const [day, month, year] = date.split("/");
                    const weekday = getWeekday(date);
                    const isToday = date === dates[0];
                    return (
                      <option key={date} value={date}>
                        {isToday ? `Hôm Nay ${day}/${month}` : `${weekday} ${day}/${month}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="schedule-filter-item">
              <div className="schedule-filter-number">2.</div>
              <div className="schedule-filter-content">
                <label>PHIM</label>
                <select 
                  className="schedule-filter-select"
                  value={selectedMovie || ""}
                  onChange={(e) => setSelectedMovie(Number(e.target.value))}
                >
                  <option value="">Chọn Phim</option>
                  {movies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="schedule-filter-item">
              <div className="schedule-filter-number">3.</div>
              <div className="schedule-filter-content">
                <label>RẠP</label>
                <select 
                  className="schedule-filter-select"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="all">Chọn Rạp</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Movie Details and Showtimes */}
          {loading && initialLoad ? (
            <div className="loading-state">Đang tải...</div>
          ) : currentMovie ? (
            <div className="schedule-content">
              {/* Movie Poster and Info (Left) */}
              <div className="schedule-movie-details">
                <div className="schedule-movie-poster">
                  <MoviePoster 
                    poster_url={currentMovie.poster || currentMovie.poster_url} 
                    title={currentMovie.title}
                  />
                  {currentMovie.rating && (
                    <span className="schedule-movie-rating">{currentMovie.rating}</span>
                  )}
                </div>
                <div className="schedule-movie-info">
                  <h2 className="schedule-movie-title">
                    {currentMovie.title} {currentMovie.rating && `(${currentMovie.rating})`}
                  </h2>
                  {currentMovie.genres && (
                    <div className="schedule-movie-meta">
                      <span className="schedule-movie-meta-icon">💬</span>
                      <span>{currentMovie.genres}</span>
                    </div>
                  )}
                  {(currentMovie.duration || currentMovie.duration_minutes) && (
                    <div className="schedule-movie-meta">
                      <span className="schedule-movie-meta-icon">🕐</span>
                      <span>{currentMovie.duration || currentMovie.duration_minutes} phút</span>
                    </div>
                  )}
                  {currentMovie.language && (
                    <div className="schedule-movie-meta">
                      <span className="schedule-movie-meta-icon">🌐</span>
                      <span>{currentMovie.country || "Việt Nam"} {currentMovie.language === "Tiếng Anh" || currentMovie.language?.includes("Anh") ? "EN" : "VN"}</span>
                    </div>
                  )}
                  {currentMovie.rating && (
                    <div className="schedule-movie-meta">
                      <span className="schedule-movie-meta-icon">👤</span>
                      <span>{getRatingDescription(currentMovie.rating)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch List with Showtimes (Right) */}
              <div className="schedule-branches-list">
                {loading ? (
                  <div className="loading-state">Đang tải lịch chiếu...</div>
                ) : Object.keys(showtimesByBranch).length > 0 ? (
                  Object.values(showtimesByBranch).map((branch) => (
                    <div key={branch.id} className="schedule-branch-item">
                      <div className="schedule-branch-header">
                        <h3 className="schedule-branch-name">{branch.name} ({branch.city})</h3>
                        <p className="schedule-branch-address">{branch.address}</p>
                      </div>
                      <div className="schedule-branch-showtimes">
                        {Object.values(branch.screens).map((screen) => (
                          <div key={screen.type} className="schedule-screen-group">
                            <span className="schedule-screen-type">{getScreenTypeLabel(screen.type)}:</span>
                            <div className="schedule-showtimes-grid">
                              {screen.showtimes.map((st) => (
                                <Link
                                  key={st.id}
                                  href={`/movie/${currentMovie.id}?showtime=${st.id}`}
                                  className="schedule-showtime-btn"
                                >
                                  {formatTime(st.start_time)}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-showtimes">
                    <p>Không có suất chiếu cho phim này trong ngày đã chọn</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "8px" }}>
                      Vui lòng thử chọn ngày khác hoặc phim khác
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : movies.length === 0 ? (
            <div className="no-showtimes">
              <p>Không có phim đang chiếu</p>
            </div>
          ) : (
            <div className="no-showtimes">
              <p>Vui lòng chọn phim để xem lịch chiếu</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}


