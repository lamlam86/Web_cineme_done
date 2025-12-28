"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyTicketsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`/api/bookings?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        
        if (data.error === "Chưa đăng nhập") {
          router.push("/login");
          return;
        }
        
        if (data.bookings) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [router]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + " VND";
  };

  // Generate QR code URL - chứa JSON thông tin vé để quét hiển thị trực tiếp
  const getQRCodeUrl = (booking) => {
    // QR code chứa JSON thông tin vé đầy đủ
    const ticketInfo = {
      code: booking.booking_code,
      movie: booking.movie,
      branch: booking.branch,
      screen: booking.screen,
      time: formatTime(booking.showtime),
      date: formatDate(booking.showtime),
      seats: booking.seats.join(", "),
      total: formatPrice(booking.total_amount),
      status: booking.payment_status === "paid" ? "DA THANH TOAN" : "CHO THANH TOAN"
    };
    const qrData = encodeURIComponent(JSON.stringify(ticketInfo));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  // Generate larger QR for modal
  const getLargeQRCodeUrl = (booking) => {
    const ticketInfo = {
      code: booking.booking_code,
      movie: booking.movie,
      branch: booking.branch,
      screen: booking.screen,
      time: formatTime(booking.showtime),
      date: formatDate(booking.showtime),
      seats: booking.seats.join(", "),
      total: formatPrice(booking.total_amount),
      status: booking.payment_status === "paid" ? "DA THANH TOAN" : "CHO THANH TOAN"
    };
    const qrData = encodeURIComponent(JSON.stringify(ticketInfo));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
  };

  // Check if ticket is paid
  const isPaid = (booking) => {
    return booking.payment_status === "paid" || booking.status === "confirmed";
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.showtime) > now);
  const pastBookings = bookings.filter(b => new Date(b.showtime) <= now);

  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  const getStatusColor = (booking) => {
    if (booking.payment_status === "paid") return "green";
    if (booking.payment_status === "refunded") return "blue";
    if (booking.payment_status === "failed") return "red";
    if (booking.status === "confirmed") return "green";
    if (booking.status === "cancelled") return "red";
    if (booking.status === "reserved") return "yellow";
    return "gray";
  };

  const getStatusText = (booking) => {
    if (booking.payment_status === "paid") return "Đã thanh toán";
    if (booking.payment_status === "refunded") return "Đã hoàn tiền";
    if (booking.payment_status === "failed") return "Thanh toán thất bại";
    if (booking.status === "confirmed") return "Đã xác nhận";
    if (booking.status === "cancelled") return "Đã hủy";
    if (booking.status === "reserved") return "Chờ thanh toán";
    return booking.status;
  };

  return (
    <div className="app">
      <Header />
      <main className="my-tickets-page">
        <div className="container">
          <h1 className="page-title">VÉ CỦA TÔI</h1>

          {/* Tabs */}
          <div className="tickets-tabs">
            <button
              className={`tickets-tab ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Sắp chiếu ({upcomingBookings.length})
            </button>
            <button
              className={`tickets-tab ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Đã xem ({pastBookings.length})
            </button>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="loading-state">Đang tải...</div>
          ) : displayedBookings.length > 0 ? (
            <div className="tickets-list">
              {displayedBookings.map(booking => (
                <div key={booking.id} className="ticket-card ticket-card--with-qr">
                  <div className="ticket-card__poster">
                    {booking.poster ? (
                      <img src={booking.poster} alt={booking.movie} />
                    ) : (
                      <div className="ticket-no-poster">
                        <span>🎬</span>
                      </div>
                    )}
                  </div>
                  <div className="ticket-card__info">
                    <div className="ticket-card__header">
                      <h3 className="ticket-card__movie">{booking.movie}</h3>
                      <span className={`ticket-card__status ticket-card__status--${getStatusColor(booking)}`}>
                        {getStatusText(booking)}
                      </span>
                    </div>
                    <div className="ticket-card__details">
                      <p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {formatDate(booking.showtime)}
                      </p>
                      <p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {formatTime(booking.showtime)}
                      </p>
                      <p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {booking.branch} - {booking.screen}
                      </p>
                      <p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 9a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3m20-7a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3"></path>
                          <rect x="4" y="6" width="16" height="12" rx="2"></rect>
                        </svg>
                        Ghế: {booking.seats.join(", ")}
                      </p>
                    </div>
                    <div className="ticket-card__footer">
                      <div className="ticket-card__code">
                        <span>Mã vé:</span>
                        <strong>{booking.booking_code}</strong>
                      </div>
                      <div className="ticket-card__total">
                        {formatPrice(booking.total_amount)}
                      </div>
                    </div>
                  </div>
                  
                  {/* QR Code - Only show for paid tickets */}
                  {isPaid(booking) ? (
                    <div 
                      className="ticket-card__qr"
                      onClick={() => setSelectedTicket(booking)}
                      title="Nhấn để phóng to"
                    >
                      <img 
                        src={getQRCodeUrl(booking)} 
                        alt="QR Code" 
                        className="ticket-qr-image"
                      />
                      <span className="ticket-qr-label">Quét mã</span>
                    </div>
                  ) : (
                    <div className="ticket-card__qr ticket-card__qr--pending">
                      <div className="ticket-qr-pending">
                        <span>⏳</span>
                        <span>CHƯA CÓ QR</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🎬</div>
              <h3>Chưa có vé nào</h3>
              <p>{activeTab === "upcoming" ? "Bạn chưa đặt vé xem phim nào" : "Bạn chưa xem phim nào"}</p>
              <Link href="/movie" className="btn-cta btn-cta--solid">
                Đặt vé ngay
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className="qr-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <button className="qr-modal__close" onClick={() => setSelectedTicket(null)}>×</button>
            
            <div className="qr-modal__content">
              <h2 className="qr-modal__title">Mã QR Vé xem phim</h2>
              
              <div className="qr-modal__qr-wrap">
                <img 
                  src={getLargeQRCodeUrl(selectedTicket)} 
                  alt="QR Code" 
                  className="qr-modal__qr-image"
                />
              </div>

              <div className="qr-modal__info">
                <div className="qr-modal__movie">{selectedTicket.movie}</div>
                <div className="qr-modal__code">Mã vé: <strong>{selectedTicket.booking_code}</strong></div>
                
                <div className="qr-modal__details">
                  <p>📅 {formatDate(selectedTicket.showtime)}</p>
                  <p>🕐 {formatTime(selectedTicket.showtime)}</p>
                  <p>📍 {selectedTicket.branch} - {selectedTicket.screen}</p>
                  <p>💺 Ghế: {selectedTicket.seats.join(", ")}</p>
                  <p>💰 {formatPrice(selectedTicket.total_amount)}</p>
                </div>

                <p className="qr-modal__note">
                  Quét mã QR này để xem vé điện tử đầy đủ
                </p>
                
                <a 
                  href={`/ticket/${selectedTicket.booking_code}`} 
                  target="_blank"
                  className="qr-modal__link"
                >
                  Xem vé điện tử →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
