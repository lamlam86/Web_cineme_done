"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import "./ticket.css";

export default function TicketPage() {
  const params = useParams();
  const code = params.code;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/ticket/${code}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Không tìm thấy vé");
          return;
        }
        
        setTicket(data.ticket);
      } catch (err) {
        setError("Lỗi tải thông tin vé");
      } finally {
        setLoading(false);
      }
    }
    
    if (code) {
      fetchTicket();
    }
  }, [code]);

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
    return price?.toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return (
      <div className="ticket-page">
        <div className="ticket-loading">
          <div className="ticket-loading-spinner"></div>
          <p>Đang tải thông tin vé...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-page">
        <div className="ticket-error">
          <div className="ticket-error-icon">❌</div>
          <h2>Không tìm thấy vé</h2>
          <p>{error}</p>
          <p className="ticket-error-code">Mã vé: {code}</p>
        </div>
      </div>
    );
  }

  const isPaid = ticket.payment_status === "paid" || ticket.status === "confirmed";

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        {/* Cinema Logo */}
        <div className="ticket-header">
          <div className="ticket-logo">
            <span className="ticket-logo-icon">🎬</span>
            <span className="ticket-logo-text">LMK CINEMA</span>
          </div>
          <div className={`ticket-status ${isPaid ? 'ticket-status--paid' : 'ticket-status--pending'}`}>
            {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHỜ THANH TOÁN'}
          </div>
        </div>

        {/* Movie Poster & Info */}
        <div className="ticket-movie">
          <div className="ticket-poster">
            {ticket.poster ? (
              <img src={ticket.poster} alt={ticket.movie} />
            ) : (
              <div className="ticket-poster-placeholder">🎬</div>
            )}
          </div>
          <div className="ticket-movie-info">
            <h1 className="ticket-movie-title">{ticket.movie}</h1>
            <div className="ticket-movie-rating">{ticket.rating || "P"}</div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="ticket-details">
          <div className="ticket-detail-row">
            <div className="ticket-detail-item">
              <span className="ticket-detail-icon">📍</span>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Rạp</span>
                <span className="ticket-detail-value">{ticket.branch}</span>
              </div>
            </div>
            <div className="ticket-detail-item">
              <span className="ticket-detail-icon">🎬</span>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Phòng chiếu</span>
                <span className="ticket-detail-value">{ticket.screen}</span>
              </div>
            </div>
          </div>

          <div className="ticket-detail-row">
            <div className="ticket-detail-item">
              <span className="ticket-detail-icon">📅</span>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Ngày chiếu</span>
                <span className="ticket-detail-value">{formatDate(ticket.showtime)}</span>
              </div>
            </div>
            <div className="ticket-detail-item">
              <span className="ticket-detail-icon">⏰</span>
              <div className="ticket-detail-content">
                <span className="ticket-detail-label">Giờ chiếu</span>
                <span className="ticket-detail-value ticket-detail-value--highlight">{formatTime(ticket.showtime)}</span>
              </div>
            </div>
          </div>

          <div className="ticket-seats">
            <span className="ticket-detail-icon">💺</span>
            <div className="ticket-detail-content">
              <span className="ticket-detail-label">Ghế ngồi</span>
              <div className="ticket-seats-list">
                {ticket.seats?.map((seat, idx) => (
                  <span key={idx} className="ticket-seat-badge">{seat}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Divider */}
        <div className="ticket-divider">
          <div className="ticket-divider-circle ticket-divider-circle--left"></div>
          <div className="ticket-divider-line"></div>
          <div className="ticket-divider-circle ticket-divider-circle--right"></div>
        </div>

        {/* Ticket Footer */}
        <div className="ticket-footer">
          <div className="ticket-code-section">
            <span className="ticket-code-label">MÃ VÉ</span>
            <span className="ticket-code-value">{ticket.booking_code}</span>
          </div>
          <div className="ticket-price-section">
            <span className="ticket-price-label">Tổng tiền</span>
            <span className="ticket-price-value">{formatPrice(ticket.total_amount)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {ticket.customer && (
          <div className="ticket-customer">
            <div className="ticket-customer-item">
              <span>👤</span>
              <span>{ticket.customer.name}</span>
            </div>
            {ticket.customer.email && (
              <div className="ticket-customer-item">
                <span>📧</span>
                <span>{ticket.customer.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Barcode Effect */}
        <div className="ticket-barcode">
          <div className="ticket-barcode-lines">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="ticket-barcode-line"
                style={{ height: `${Math.random() * 20 + 20}px` }}
              ></div>
            ))}
          </div>
          <span className="ticket-barcode-text">{ticket.booking_code}</span>
        </div>

        {/* Footer Note */}
        <div className="ticket-note">
          <p>Vui lòng đến trước giờ chiếu 15 phút</p>
          <p>Xuất trình mã vé này tại quầy để nhận vé</p>
        </div>
      </div>
    </div>
  );
}
