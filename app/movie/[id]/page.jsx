"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

function getRatingDescription(rating) {
  if (!rating) return "";
  if (rating === "P") return "P: Phim dành cho mọi đối tượng khán giả";
  if (rating.includes("13")) return "T13: Phim dành cho khán giả từ đủ 13 tuổi trở lên (13+)";
  if (rating.includes("16")) return "T16: Phim dành cho khán giả từ đủ 16 tuổi trở lên (16+)";
  if (rating.includes("18")) return "T18: Phim dành cho khán giả từ đủ 18 tuổi trở lên (18+)";
  return "";
}

function getWeekday(dateStr) {
  const [day, month, year] = dateStr.split("/");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekdays = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return weekdays[date.getDay()];
}

// Số vé tối đa có thể chọn
const MAX_TICKETS = 10;

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [expandSynopsis, setExpandSynopsis] = useState(false);
  
  // User state (for guest check)
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Booking state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [concessions, setConcessions] = useState({});
  
  // Data from API
  const [seats, setSeats] = useState({});
  const [screenInfo, setScreenInfo] = useState(null);
  const [basePrice, setBasePrice] = useState(65000);
  const [priceMap, setPriceMap] = useState({});
  const [concessionList, setConcessionList] = useState({ combos: [], drinks: [], popcorn: [] });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (e) {
        // Not logged in - guest mode
      } finally {
        setUserLoading(false);
      }
    }
    checkUser();
  }, []);

  // Fetch movie data
  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(`/api/movies/${params.id}?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.movie) {
          setMovie(data.movie);
          if (data.dates && data.dates.length > 0) {
            setSelectedDate(data.dates[0]);
          }
        }
        if (data.relatedMovies) {
          setRelatedMovies(data.relatedMovies);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovie();
  }, [params.id]);

  // Fetch concessions
  useEffect(() => {
    async function fetchConcessions() {
      try {
        const res = await fetch("/api/concessions");
        const data = await res.json();
        if (data.concessions) {
          setConcessionList({
            combos: data.concessions.combo || [],
            drinks: data.concessions.drink || [],
            popcorn: data.concessions.popcorn || [],
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchConcessions();
  }, []);

  // Fetch seats when showtime is selected
  const fetchSeats = useCallback(async (showtimeId) => {
    try {
      const res = await fetch(`/api/showtimes/${showtimeId}/seats?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.seats) {
        setSeats(data.seats);
        setScreenInfo(data.screen);
        setBasePrice(data.base_price || 65000);
        setPriceMap(data.price_map || {});
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (selectedShowtime) {
      fetchSeats(selectedShowtime.id);
      setSelectedSeats([]);
    }
  }, [selectedShowtime, fetchSeats]);

  // Số ghế đã chọn
  const totalTickets = selectedSeats.length;

  // Lấy giá vé theo loại ghế
  const getSeatPrice = useCallback((seatType) => {
    return priceMap[seatType] || priceMap["standard"] || basePrice;
  }, [priceMap, basePrice]);

  // Calculate totals - based on seat type prices
  const totals = useMemo(() => {
    // Tính tổng tiền vé theo loại ghế
    const ticketTotal = selectedSeats.reduce((sum, seat) => {
      return sum + getSeatPrice(seat.seat_type);
    }, 0);

    let concessionTotal = 0;
    Object.entries(concessions).forEach(([id, qty]) => {
      const allItems = [...(concessionList.combos || []), ...(concessionList.drinks || []), ...(concessionList.popcorn || [])];
      const item = allItems.find(c => c.id === Number(id));
      if (item) concessionTotal += item.price * qty;
    });

    return {
      tickets: ticketTotal,
      concessions: concessionTotal,
      total: ticketTotal + concessionTotal,
    };
  }, [selectedSeats, concessions, concessionList, getSeatPrice]);

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") return;
    
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) {
        // Bỏ chọn ghế
        return prev.filter(s => s.id !== seat.id);
      }
      // Thêm ghế nếu chưa đạt giới hạn
      if (prev.length >= MAX_TICKETS) {
        return prev; // Không cho chọn thêm
      }
      return [...prev, seat];
    });
  };

  const handleConcessionChange = (id, delta) => {
    setConcessions(prev => {
      const current = prev[id] || 0;
      const newQty = Math.max(0, Math.min(10, current + delta));
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + " VND";
  };

  const getSeatClass = (seat) => {
    let classes = ["seat"];
    classes.push(`seat--${seat.seat_type}`);
    if (seat.status === "booked") {
      classes.push("seat--booked");
    } else if (selectedSeats.find(s => s.id === seat.id)) {
      classes.push("seat--selected");
    }
    return classes.join(" ");
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle add to cart - requires login
  const handleAddToCart = () => {
    // Check if user is logged in
    if (!user) {
      // Save current page to redirect back after login
      router.push(`/login?redirect=/movie/${params.id}`);
      return;
    }

    if (!selectedShowtime || selectedSeats.length === 0) return;

    // Build cart item with full seat data
    const cartItem = {
      movie: {
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        rating: movie.rating,
      },
      showtime: {
        id: selectedShowtime.id,
        start_time: selectedShowtime.start_time,
        base_price: basePrice,
        branch: selectedShowtime.screen?.branch?.name || selectedShowtime.branch,
        screen: selectedShowtime.screen?.name || selectedShowtime.screen,
      },
      // Store both labels for display and IDs for API with individual seat prices
      seats: selectedSeats.map(s => s.label || s.seat_code || `${s.seat_row}${s.seat_number}`),
      seatData: selectedSeats.map(s => ({
        seat_id: s.id,
        price: getSeatPrice(s.seat_type),
        label: s.label || s.seat_code || `${s.seat_row}${s.seat_number}`,
        seat_type: s.seat_type,
      })),
      concessions: concessions,
      concessionItems: [...concessionList.combos, ...concessionList.popcorn, ...concessionList.drinks],
    };

    addToCart(cartItem);

    // Reset form
    setSelectedSeats([]);
    setConcessions({});
    // Keep showtime selected for user convenience
  };

  // Direct checkout (add to cart then go to checkout) - requires login
  const handleCheckoutNow = () => {
    // Check if user is logged in
    if (!user) {
      router.push(`/login?redirect=/movie/${params.id}`);
      return;
    }

    if (!selectedShowtime || selectedSeats.length === 0) return;

    // Build and add cart item with individual seat prices
    const cartItem = {
      movie: {
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        rating: movie.rating,
      },
      showtime: {
        id: selectedShowtime.id,
        start_time: selectedShowtime.start_time,
        base_price: basePrice,
        branch: selectedShowtime.screen?.branch?.name || selectedShowtime.branch,
        screen: selectedShowtime.screen?.name || selectedShowtime.screen,
      },
      seats: selectedSeats.map(s => s.label || s.seat_code || `${s.seat_row}${s.seat_number}`),
      seatData: selectedSeats.map(s => ({
        seat_id: s.id,
        price: getSeatPrice(s.seat_type),
        label: s.label || s.seat_code || `${s.seat_row}${s.seat_number}`,
        seat_type: s.seat_type,
      })),
      concessions: concessions,
      concessionItems: [...concessionList.combos, ...concessionList.popcorn, ...concessionList.drinks],
    };

    addToCart(cartItem);
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="movie-detail-page">
          <div className="container">
            <div className="loading-state">Đang tải...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="app">
        <Header />
        <main className="movie-detail-page">
          <div className="container">
            <div className="error-state">Không tìm thấy phim</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get unique dates from showtimes
  const dates = movie.showtimes ? [...new Set(
    movie.showtimes.map(st => {
      const d = new Date(st.start_time);
      return d.toLocaleDateString("vi-VN");
    })
  )].slice(0, 7) : [];

  // Get showtimes for selected date
  const showtimesForDate = selectedDate && movie.showtimes 
    ? movie.showtimes.filter(st => {
        const d = new Date(st.start_time);
        return d.toLocaleDateString("vi-VN") === selectedDate;
      })
    : [];

  // Group by branch
  const showtimesByBranch = showtimesForDate.reduce((acc, st) => {
    const branchName = st.screen?.branch?.name || "Rạp";
    if (!acc[branchName]) acc[branchName] = [];
    acc[branchName].push(st);
    return acc;
  }, {});

  const releaseWeekday = movie.release_date 
    ? new Date(movie.release_date).toLocaleDateString("vi-VN", { weekday: "long" })
    : "";

  const seatRows = Object.keys(seats).sort();

  return (
    <div className="app">
      <Header />
      <main className="movie-detail-page">
        <div className="container">
          {/* Movie Info Section */}
          <section className="movie-info-section">
            <div className="movie-poster-wrap">
              <div className="movie-badges">
                <span className="movie-badge movie-badge--2d">2D</span>
                {movie.rating && (
                  <span className={`movie-badge movie-badge--rating ${movie.rating.replace(/[^a-zA-Z0-9]/g, '')}`}>
                    {movie.rating}
                  </span>
                )}
              </div>
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="movie-poster-img"
                />
              ) : (
                <div className="movie-poster-placeholder">
                  <span>🎬</span>
                  <p>Chưa có poster</p>
                </div>
              )}
            </div>

            <div className="movie-info-content">
              <h1 className="movie-title">
                {movie.title} {movie.rating && `(${movie.rating})`}
              </h1>

              <div className="movie-meta-list">
                {movie.genres && (
                  <div className="movie-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{movie.genres}</span>
                  </div>
                )}
                {movie.duration_minutes && (
                  <div className="movie-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{movie.duration_minutes}&apos;</span>
                  </div>
                )}
                {(movie.country || movie.language) && (
                  <div className="movie-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <span>{movie.country || (movie.language?.includes("Việt") ? "Việt Nam" : "Quốc tế")}</span>
                  </div>
                )}
                {movie.language && (
                  <div className="movie-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>{movie.language?.includes("Phụ đề") ? "Phụ đề Việt" : "VN"}</span>
                  </div>
                )}
                {movie.rating && (
                  <div className="movie-meta-item movie-meta-item--rating">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span className="rating-warning">{getRatingDescription(movie.rating)}</span>
                  </div>
                )}
              </div>

              {/* MÔ TẢ Section */}
              <div className="movie-desc-section">
                <h3 className="movie-section-title">MÔ TẢ</h3>
                <div className="movie-desc-content">
                  {movie.director && (
                    <p><strong>Đạo diễn:</strong> {movie.director}</p>
                  )}
                  {movie.cast && (
                    <p><strong>Diễn viên:</strong> {movie.cast}</p>
                  )}
                  {movie.release_date && (
                    <p><strong>Khởi chiếu:</strong> {releaseWeekday}, {new Date(movie.release_date).toLocaleDateString("vi-VN")}</p>
                  )}
                </div>
              </div>

              {/* NỘI DUNG PHIM Section */}
              <div className="movie-synopsis-section">
                <h3 className="movie-section-title">NỘI DUNG PHIM</h3>
                <div className={`movie-synopsis ${expandSynopsis ? 'expanded' : ''}`}>
                  <p>{movie.synopsis || "Chưa có mô tả cho phim này."}</p>
                </div>
                {movie.synopsis && movie.synopsis.length > 300 && (
                  <button 
                    className="btn-expand" 
                    onClick={() => setExpandSynopsis(!expandSynopsis)}
                  >
                    {expandSynopsis ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>

              {/* Trailer Button */}
              {movie.trailer_url && (
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-trailer"
                >
                  <span className="btn-trailer__icon">▶</span>
                  Xem Trailer
                </a>
              )}
            </div>
          </section>

          {/* BOOKING SECTIONS - Always visible for now_showing movies */}
          {movie.status === "now_showing" && (
            <>
              {/* LỊCH CHIẾU Section */}
              <section className="booking-section">
                <h2 className="booking-section-title">LỊCH CHIẾU</h2>
                
                {/* Date Tabs */}
                <div className="schedule-dates">
                  {dates.length > 0 ? dates.map((date) => {
                    const [day, month] = date.split("/");
                    const weekday = getWeekday(date);
                    return (
                      <button
                        key={date}
                        className={`schedule-date-btn ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedShowtime(null);
                        }}
                      >
                        <span className="schedule-date-day">{day}/{month}</span>
                        <span className="schedule-date-weekday">{weekday}</span>
                      </button>
                    );
                  }) : (
                    <p className="no-schedule">Chưa có lịch chiếu</p>
                  )}
                </div>

                {/* Showtimes by Branch */}
                {Object.keys(showtimesByBranch).length > 0 && (
                  <div className="schedule-branches">
                    {Object.entries(showtimesByBranch).map(([branchName, times]) => (
                      <div key={branchName} className="schedule-branch">
                        <h4 className="schedule-branch-name">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {branchName}
                        </h4>
                        <div className="schedule-times">
                          {times.map((st) => (
                            <button
                              key={st.id}
                              className={`schedule-time-btn ${selectedShowtime?.id === st.id ? 'active' : ''}`}
                              onClick={() => setSelectedShowtime(st)}
                            >
                              {formatTime(st.start_time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dates.length > 0 && Object.keys(showtimesByBranch).length === 0 && (
                  <p className="no-schedule">Không có suất chiếu trong ngày này</p>
                )}
              </section>

              {/* CHỌN GHẾ */}
              <section className="booking-section">
                <h2 className="booking-section-title">
                  CHỌN GHẾ {screenInfo ? `- ${screenInfo.name}` : selectedShowtime ? "" : "- Vui lòng chọn suất chiếu"}
                </h2>
                
                <div className="seat-map-container">
                  <div className="screen-container">
                    <div className="screen">Màn hình</div>
                  </div>

                  {seatRows.length > 0 ? (
                    <div className="seat-map">
                      {seatRows.map((row) => (
                        <div key={row} className="seat-row">
                          <span className="seat-row-label">{row}</span>
                          <div className="seat-row-seats">
                            {seats[row]?.map((seat) => (
                              <button
                                key={seat.id}
                                className={getSeatClass(seat)}
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status === "booked"}
                                title={seat.seat_code}
                              >
                                {seat.seat_number.toString().padStart(2, "0")}
                              </button>
                            ))}
                          </div>
                          <span className="seat-row-label">{row}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="seat-map-placeholder">
                      <p>Vui lòng chọn suất chiếu để xem sơ đồ ghế</p>
                    </div>
                  )}

                  <div className="seat-legend">
                    <div className="legend-item">
                      <span className="legend-seat legend-seat--standard"></span>
                      <span>Ghế Thường - {formatPrice(priceMap.standard || 65000)}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-seat legend-seat--vip"></span>
                      <span>Ghế VIP - {formatPrice(priceMap.vip || 85000)}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-seat legend-seat--selected"></span>
                      <span>Ghế đang chọn</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-seat legend-seat--booked"></span>
                      <span>Ghế đã đặt</span>
                    </div>
                  </div>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="selected-seats-info">
                    <strong>Ghế đã chọn:</strong> {selectedSeats.map(s => s.seat_code).join(", ")}
                  </div>
                )}
              </section>

              {/* CHỌN BẮP NƯỚC */}
              <section className="booking-section">
                <h2 className="booking-section-title">CHỌN BẮP NƯỚC</h2>
                
                {concessionList.combos?.length > 0 && (
                  <div className="concession-category">
                    <h3 className="concession-category-title">COMBO</h3>
                    <div className="concession-grid">
                      {concessionList.combos.map((item) => (
                        <div key={item.id} className="concession-card">
                          <div className="concession-image">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} />
                            ) : (
                              <div className="concession-placeholder">🍿</div>
                            )}
                          </div>
                          <div className="concession-info">
                            <h4 className="concession-name">{item.name}</h4>
                            <p className="concession-desc">{item.description}</p>
                            <p className="concession-price">{formatPrice(item.price)}</p>
                          </div>
                          <div className="concession-qty">
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, -1)}
                            >
                              −
                            </button>
                            <span className="qty-value">{concessions[item.id] || 0}</span>
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {concessionList.popcorn?.length > 0 && (
                  <div className="concession-category">
                    <h3 className="concession-category-title">BẮP RANG</h3>
                    <div className="concession-grid">
                      {concessionList.popcorn.map((item) => (
                        <div key={item.id} className="concession-card">
                          <div className="concession-image">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} />
                            ) : (
                              <div className="concession-placeholder">🍿</div>
                            )}
                          </div>
                          <div className="concession-info">
                            <h4 className="concession-name">{item.name}</h4>
                            <p className="concession-desc">{item.description}</p>
                            <p className="concession-price">{formatPrice(item.price)}</p>
                          </div>
                          <div className="concession-qty">
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, -1)}
                            >
                              −
                            </button>
                            <span className="qty-value">{concessions[item.id] || 0}</span>
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {concessionList.drinks?.length > 0 && (
                  <div className="concession-category">
                    <h3 className="concession-category-title">NƯỚC NGỌT</h3>
                    <div className="concession-grid concession-grid--drinks">
                      {concessionList.drinks.map((item) => (
                        <div key={item.id} className="concession-card concession-card--drink">
                          <div className="concession-image">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} />
                            ) : (
                              <div className="concession-placeholder">🥤</div>
                            )}
                          </div>
                          <div className="concession-info">
                            <h4 className="concession-name">{item.name}</h4>
                            <p className="concession-price">{formatPrice(item.price)}</p>
                          </div>
                          <div className="concession-qty">
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, -1)}
                            >
                              −
                            </button>
                            <span className="qty-value">{concessions[item.id] || 0}</span>
                            <button 
                              className="qty-btn qty-btn--small"
                              onClick={() => handleConcessionChange(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Booking Summary */}
              <section className="booking-summary">
                <div className="summary-content">
                  <div className="summary-row">
                    <span>Vé ({totalTickets} ghế):</span>
                    <span>{formatPrice(totals.tickets)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Bắp nước:</span>
                    <span>{formatPrice(totals.concessions)}</span>
                  </div>
                  <div className="summary-row summary-row--total">
                    <span>Tổng:</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                </div>
                <div className="booking-summary__actions">
                  <button 
                    className="btn-add-cart"
                    disabled={!selectedShowtime || selectedSeats.length === 0}
                    onClick={handleAddToCart}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    THÊM VÀO GIỎ
                  </button>
                  <button 
                    className="btn-checkout"
                    disabled={!selectedShowtime || selectedSeats.length === 0}
                    onClick={handleCheckoutNow}
                  >
                    {!selectedShowtime
                      ? "CHỌN SUẤT CHIẾU"
                      : selectedSeats.length === 0 
                        ? "VUI LÒNG CHỌN GHẾ" 
                        : "THANH TOÁN NGAY"
                    }
                  </button>
                </div>
              </section>
            </>
          )}

          {/* Related Movies - for coming soon movies */}
          {movie.status !== "now_showing" && relatedMovies.length > 0 && (
            <section className="movie-related-section">
              <h2 className="section-heading">PHIM LIÊN QUAN</h2>
              <div className="movies-grid">
                {relatedMovies.map((m) => (
                  <div key={m.id} className="mv-card">
                    <Link href={`/movie/${m.id}`} className="mv-card__poster">
                      {m.poster_url ? (
                        <img src={m.poster_url} alt={m.title} />
                      ) : (
                        <div className="mv-card__no-poster">
                          <span>🎬</span>
                        </div>
                      )}
                      {m.rating && <span className="mv-card__age">{m.rating}</span>}
                    </Link>
                    <h3 className="mv-card__title">{m.title}</h3>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
