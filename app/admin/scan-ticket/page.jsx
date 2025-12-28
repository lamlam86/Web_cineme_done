"use client";
import { useState, useRef } from "react";

export default function ScanTicketPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketCode.trim()) {
      setError("Vui lòng nhập mã vé");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/bookings/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_data: ticketCode.trim() })
      });

      const data = await res.json();

      if (data.valid) {
        setResult({ type: "success", data: data.booking, message: data.message });
      } else {
        setResult({ type: "error", message: data.error || "Vé không hợp lệ", data: data.booking });
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTicketCode("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

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
    return price?.toLocaleString("vi-VN") + " VND";
  };

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Vận hành</p>
          <h2>Quét vé QR</h2>
        </div>
      </div>

      <div className="scan-ticket-container">
        {/* Input Section */}
        <div className="scan-ticket-input-section">
          <div className="scan-ticket-card">
            <div className="scan-ticket-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="3" height="3"/>
                <rect x="18" y="14" width="3" height="3"/>
                <rect x="14" y="18" width="3" height="3"/>
                <rect x="18" y="18" width="3" height="3"/>
              </svg>
            </div>
            
            <h3>Nhập mã vé hoặc quét QR</h3>
            <p>Nhập mã vé từ QR code để xác thực vé của khách hàng</p>

            <form onSubmit={handleSubmit} className="scan-ticket-form">
              <input
                ref={inputRef}
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã vé (VD: 2QJIOX3U)"
                className="scan-ticket-input"
                autoFocus
                disabled={loading}
              />
              
              <div className="scan-ticket-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary scan-ticket-btn"
                  disabled={loading || !ticketCode.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      Kiểm tra vé
                    </>
                  )}
                </button>
                
                {(result || error) && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Quét vé mới
                  </button>
                )}
              </div>
            </form>

            {error && (
              <div className="scan-ticket-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="scan-ticket-result-section">
            <div className={`scan-ticket-result scan-ticket-result--${result.type}`}>
              {/* Status Header */}
              <div className="scan-result-header">
                {result.type === "success" ? (
                  <>
                    <div className="scan-result-icon scan-result-icon--success">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                    <h3 className="scan-result-title scan-result-title--success">VÉ HỢP LỆ</h3>
                    <p className="scan-result-message">Khách hàng có thể vào rạp</p>
                  </>
                ) : (
                  <>
                    <div className="scan-result-icon scan-result-icon--error">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <h3 className="scan-result-title scan-result-title--error">VÉ KHÔNG HỢP LỆ</h3>
                    <p className="scan-result-message">{result.message}</p>
                  </>
                )}
              </div>

              {/* Ticket Details */}
              {result.data && (
                <div className="scan-result-details">
                  <div className="scan-detail-row scan-detail-row--highlight">
                    <span className="scan-detail-label">Mã vé</span>
                    <span className="scan-detail-value scan-detail-code">{result.data.booking_code}</span>
                  </div>
                  
                  {result.data.movie && (
                    <div className="scan-detail-row">
                      <span className="scan-detail-label">🎬 Phim</span>
                      <span className="scan-detail-value">{result.data.movie}</span>
                    </div>
                  )}
                  
                  {result.data.showtime && (
                    <>
                      <div className="scan-detail-row">
                        <span className="scan-detail-label">📅 Ngày</span>
                        <span className="scan-detail-value">{formatDate(result.data.showtime)}</span>
                      </div>
                      <div className="scan-detail-row">
                        <span className="scan-detail-label">🕐 Giờ</span>
                        <span className="scan-detail-value">{formatTime(result.data.showtime)}</span>
                      </div>
                    </>
                  )}
                  
                  {result.data.branch && (
                    <div className="scan-detail-row">
                      <span className="scan-detail-label">📍 Rạp</span>
                      <span className="scan-detail-value">{result.data.branch}</span>
                    </div>
                  )}
                  
                  {result.data.screen && (
                    <div className="scan-detail-row">
                      <span className="scan-detail-label">🎥 Phòng</span>
                      <span className="scan-detail-value">{result.data.screen}</span>
                    </div>
                  )}
                  
                  {result.data.seats && (
                    <div className="scan-detail-row scan-detail-row--highlight">
                      <span className="scan-detail-label">💺 Ghế</span>
                      <span className="scan-detail-value scan-detail-seats">
                        {Array.isArray(result.data.seats) ? result.data.seats.join(", ") : result.data.seats}
                      </span>
                    </div>
                  )}
                  
                  {result.data.customer_name && (
                    <div className="scan-detail-row">
                      <span className="scan-detail-label">👤 Khách hàng</span>
                      <span className="scan-detail-value">{result.data.customer_name}</span>
                    </div>
                  )}
                  
                  {result.data.total_amount && (
                    <div className="scan-detail-row">
                      <span className="scan-detail-label">💰 Tổng tiền</span>
                      <span className="scan-detail-value">{formatPrice(result.data.total_amount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
