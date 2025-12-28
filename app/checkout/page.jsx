"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, getCartTotal, getCartCount, removeFromCart } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [qrPayment, setQrPayment] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [bookingIds, setBookingIds] = useState([]);
  const [savedCartData, setSavedCartData] = useState(null); // Lưu cart data trước khi xóa
  const [seatErrors, setSeatErrors] = useState([]); // Lưu lỗi ghế đã đặt
  const [timeLeft, setTimeLeft] = useState(null); // Thời gian còn lại để thanh toán
  const checkIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Khôi phục pending payment từ localStorage khi load trang
  useEffect(() => {
    const pendingPayment = localStorage.getItem("lmk_pending_payment");
    if (pendingPayment) {
      try {
        const parsed = JSON.parse(pendingPayment);
        const expiresAt = new Date(parsed.expires_at);
        const now = new Date();
        
        // Kiểm tra còn hạn không
        if (expiresAt > now) {
          setQrPayment(parsed.qrPayment);
          setBookingIds(parsed.bookingIds);
          setSavedCartData(parsed.savedCartData);
          setPaymentMethod("bank");
          // Tính thời gian còn lại
          const remaining = Math.floor((expiresAt - now) / 1000);
          setTimeLeft(remaining);
          // Tiếp tục kiểm tra thanh toán
          startPaymentCheck(parsed.qrPayment.transaction_id, remaining);
        } else {
          // Đã hết hạn, xóa pending payment
          localStorage.removeItem("lmk_pending_payment");
        }
      } catch (e) {
        console.error("Error restoring pending payment:", e);
        localStorage.removeItem("lmk_pending_payment");
      }
    }
  }, []);

  // Countdown timer cho QR payment
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết hạn
          handlePaymentExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Cleanup intervals khi unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePaymentExpired = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCheckingPayment(false);
    localStorage.removeItem("lmk_pending_payment");
    alert("Mã QR đã hết hạn. Vui lòng thực hiện lại giao dịch.");
    // Reset state để cho phép đặt lại
    setQrPayment(null);
    setBookingIds([]);
    setSavedCartData(null);
    setTimeLeft(null);
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Kiểm tra ghế đã đặt khi load trang
  useEffect(() => {
    async function checkBookedSeats() {
      if (cart.length === 0) return;
      
      const errors = [];
      for (const item of cart) {
        if (item.type === 'ticket' && item.showtime?.id && item.seatData?.length > 0) {
          try {
            const seatIds = item.seatData.map(s => s.seat_id).join(',');
            const res = await fetch(`/api/showtimes/${item.showtime.id}/check-seats?seats=${seatIds}`);
            const data = await res.json();
            
            if (data.bookedSeats && data.bookedSeats.length > 0) {
              errors.push({
                itemId: item.id,
                movie: item.movie?.title,
                bookedSeats: data.bookedSeats,
              });
            }
          } catch (e) {
            console.error("Error checking seats:", e);
          }
        }
      }
      setSeatErrors(errors);
    }
    
    checkBookedSeats();
  }, [cart]);

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const calculateItemTotal = (item) => {
    // Tính tiền vé từ seatData (có giá riêng mỗi ghế từ ticket_prices)
    const ticketTotal = item.seatData?.length > 0
      ? item.seatData.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
      : (item.seats?.length || 0) * (Number(item.showtime?.base_price) || 65000);
    const concessionTotal = Object.entries(item.concessions || {}).reduce((sum, [id, qty]) => {
      if (!qty || qty <= 0) return sum;
      const concession = item.concessionItems?.find(c => c.id === Number(id));
      return sum + (concession ? Number(concession.price) * qty : 0);
    }, 0);
    return ticketTotal + concessionTotal;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const res = await fetch(`/api/promotions/check?code=${promoCode}&total=${getCartTotal()}`);
      const data = await res.json();
      
      if (data.valid) {
        setDiscount(data.discount);
        setPromoMessage(`Áp dụng thành công! Giảm ${formatPrice(data.discount)}`);
      } else {
        setDiscount(0);
        setPromoMessage(data.message || "Mã khuyến mãi không hợp lệ");
      }
    } catch (e) {
      setPromoMessage("Lỗi kiểm tra mã khuyến mãi");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cart.length === 0 && bookingIds.length === 0) {
      return;
    }

    setProcessing(true);

    try {
      let finalBookingIds = bookingIds;

      // Chỉ tạo booking mới nếu chưa có bookingIds (tránh tạo trùng khi retry)
      if (bookingIds.length === 0) {
        const createdBookingIds = [];

        // Create bookings for each item in cart
        for (const item of cart) {
          // Validate item has required data
          if (!item.showtime?.id) {
            throw new Error("Thiếu thông tin suất chiếu");
          }

          // Format seats for API - must have seat_id and price from seatData
          if (!item.seatData || item.seatData.length === 0) {
            throw new Error("Thiếu thông tin ghế ngồi");
          }
          
          const seatsForApi = item.seatData.map(s => ({
            seat_id: Number(s.seat_id),
            price: Number(s.price) || 65000,
          }));

          // Format concessions for API (needs concession_id and quantity)
          const concessionsForApi = Object.entries(item.concessions || {})
            .filter(([, qty]) => qty > 0)
            .map(([id, qty]) => ({
              concession_id: Number(id),
              quantity: Number(qty),
            }));

          const bookingData = {
            showtime_id: Number(item.showtime.id),
            seats: seatsForApi,
            concessions: concessionsForApi,
            payment_method: paymentMethod === "bank" ? "bank_transfer" : paymentMethod,
          };

          const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Đặt vé thất bại");
          }

          createdBookingIds.push(data.booking.id);
        }

        finalBookingIds = createdBookingIds;
        setBookingIds(createdBookingIds);
        
        // Lưu cart data trước khi xóa để hiển thị thông tin đơn hàng
        setSavedCartData({
          items: [...cart],
          total: getCartTotal(),
          count: getCartCount()
        });
        
        // Xóa giỏ hàng ngay sau khi tạo booking thành công
        clearCart();
      }

      // Nếu là thanh toán chuyển khoản, tạo QR code
      if (paymentMethod === "bank") {
        // Tạo QR cho booking đầu tiên (hoặc có thể tạo cho tất cả)
        const firstBookingId = finalBookingIds[0];
        const qrRes = await fetch("/api/payments/create-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: firstBookingId }),
        });

        const qrData = await qrRes.json();
        if (qrRes.ok && qrData.success) {
          setQrPayment(qrData.payment);
          
          // Lưu pending payment vào localStorage để khôi phục khi quay lại
          const pendingPaymentData = {
            qrPayment: qrData.payment,
            bookingIds: finalBookingIds,
            savedCartData: {
              items: savedCartData?.items || [...cart],
              total: savedCartData?.total || getCartTotal(),
              count: savedCartData?.count || getCartCount()
            },
            expires_at: qrData.payment.expires_at,
            created_at: new Date().toISOString()
          };
          localStorage.setItem("lmk_pending_payment", JSON.stringify(pendingPaymentData));
          
          // Set thời gian còn lại (10 phút = 600 giây)
          const expiresAt = new Date(qrData.payment.expires_at);
          const remaining = Math.floor((expiresAt - new Date()) / 1000);
          setTimeLeft(remaining > 0 ? remaining : 600);
          
          // Bắt đầu kiểm tra thanh toán tự động
          startPaymentCheck(qrData.payment.transaction_id, remaining > 0 ? remaining : 600);
        } else {
          throw new Error(qrData.error || "Lỗi tạo mã QR thanh toán");
        }
      } else {
        // Các phương thức khác: redirect đến success
        router.push("/checkout/success");
      }

    } catch (error) {
      alert("Lỗi đặt vé: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Kiểm tra trạng thái thanh toán tự động
  const startPaymentCheck = (transactionId, remainingSeconds = 600) => {
    setCheckingPayment(true);
    
    // Clear existing intervals
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    checkIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/payments/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: transactionId }),
        });

        const data = await res.json();
        
        if (data.success && data.status === "paid") {
          clearInterval(checkIntervalRef.current);
          clearTimeout(timeoutRef.current);
          setCheckingPayment(false);
          // Xóa pending payment khi thanh toán thành công
          localStorage.removeItem("lmk_pending_payment");
          clearCart();
          router.push("/checkout/success");
        } else if (data.status === "expired" || data.status === "failed") {
          handlePaymentExpired();
        }
      } catch (error) {
        console.error("Error checking payment:", error);
      }
    }, 5000); // Kiểm tra mỗi 5 giây

    // Dừng kiểm tra sau thời gian còn lại
    timeoutRef.current = setTimeout(() => {
      handlePaymentExpired();
    }, remainingSeconds * 1000);
  };

  // Sử dụng savedCartData nếu cart đã bị xóa (khi đang hiển thị QR)
  const displayCart = cart.length > 0 ? cart : (savedCartData?.items || []);
  const displayTotal = cart.length > 0 ? getCartTotal() : (savedCartData?.total || 0);
  const displayCount = cart.length > 0 ? getCartCount() : (savedCartData?.count || 0);
  const finalTotal = displayTotal - discount;

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="checkout-page">
          <div className="container">
            <div className="loading-state">Đang tải...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="checkout-page">
        <div className="container">
          <h1 className="page-title">THANH TOÁN</h1>

          {/* Cảnh báo ghế đã đặt */}
          {seatErrors.length > 0 && (
            <div className="seat-error-alert">
              <div className="seat-error-alert__icon">⚠️</div>
              <div className="seat-error-alert__content">
                <h3>Một số ghế đã được đặt!</h3>
                {seatErrors.map((err, idx) => (
                  <p key={idx}>
                    <strong>{err.movie}</strong>: Ghế {err.bookedSeats.map(s => s.seat_code).join(", ")} đã được người khác đặt.
                  </p>
                ))}
                <p>Vui lòng xóa khỏi giỏ hàng và chọn ghế khác.</p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // Xóa các item có ghế đã đặt
                  seatErrors.forEach(err => {
                    removeFromCart(err.itemId);
                  });
                  setSeatErrors([]);
                }}
              >
                Xóa và chọn lại
              </button>
            </div>
          )}

          {displayCart.length === 0 && !qrPayment && bookingIds.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🛒</div>
              <h3>Giỏ hàng trống</h3>
              <p>Bạn chưa chọn vé nào để thanh toán</p>
              <button className="btn btn-primary" onClick={() => router.push("/movie")}>
                Đặt vé ngay
              </button>
            </div>
          ) : (
            <div className="checkout-content">
              {/* Order Summary */}
              <div className="checkout-orders">
                <h2>Chi tiết đơn hàng ({displayCount} vé)</h2>
                
                {displayCart.map(item => (
                  <div key={item.id} className="checkout-order-item">
                    <div className="checkout-order-item__header">
                      <div className="checkout-order-item__poster">
                        {item.movie.poster_url ? (
                          <img src={item.movie.poster_url} alt={item.movie.title} />
                        ) : (
                          <div className="poster-placeholder-sm">🎬</div>
                        )}
                      </div>
                      <div className="checkout-order-item__movie">
                        <h3>{item.movie.title}</h3>
                        <p className="checkout-order-item__rating">{item.movie.rating || "P"}</p>
                      </div>
                    </div>

                    <div className="checkout-order-item__details">
                      <div className="detail-row">
                        <span>📍 Rạp:</span>
                        <strong>{item.showtime.branch}</strong>
                      </div>
                      <div className="detail-row">
                        <span>🎬 Phòng:</span>
                        <strong>{item.showtime.screen}</strong>
                      </div>
                      <div className="detail-row">
                        <span>📅 Suất chiếu:</span>
                        <strong>{formatTime(item.showtime.start_time)} - {formatDate(item.showtime.start_time)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>💺 Ghế ({item.seats.length}):</span>
                        <strong>{item.seats.join(", ")}</strong>
                      </div>
                      {item.seatData && (
                        <div className="detail-row detail-row--seats">
                          <span>🎟️ Chi tiết vé:</span>
                          <div className="seat-prices">
                            {item.seatData.map((s, idx) => (
                              <span key={idx} className="seat-price-item">
                                {s.label}: {formatPrice(s.price || 65000)} ({s.seat_type === 'vip' ? 'VIP' : 'Thường'})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="detail-row">
                        <span>💰 Tổng vé:</span>
                        <strong>{item.seatData 
                          ? formatPrice(item.seatData.reduce((sum, s) => sum + (s.price || 65000), 0))
                          : formatPrice(item.seats.length * 65000)
                        }</strong>
                      </div>
                    </div>

                    {Object.keys(item.concessions || {}).length > 0 && (
                      <div className="checkout-order-item__concessions">
                        <h4>🍿 Bắp nước:</h4>
                        {Object.entries(item.concessions).map(([id, qty]) => {
                          if (qty === 0) return null;
                          const concession = item.concessionItems?.find(c => c.id === Number(id));
                          return concession ? (
                            <div key={id} className="detail-row">
                              <span>{concession.name} x{qty}</span>
                              <strong>{formatPrice(concession.price * qty)}</strong>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    <div className="checkout-order-item__subtotal">
                      <span>Thành tiền:</span>
                      <strong>{formatPrice(calculateItemTotal(item))}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Section */}
              <div className="checkout-payment">
                {/* User Info */}
                {user ? (
                  <div className="checkout-user">
                    <h3>Thông tin khách hàng</h3>
                    <p><strong>{user.fullName}</strong></p>
                    <p>{user.email}</p>
                    {user.phone && <p>{user.phone}</p>}
                  </div>
                ) : (
                  <div className="checkout-login-prompt">
                    <h3>Vui lòng đăng nhập</h3>
                    <p>Bạn cần đăng nhập để tiếp tục thanh toán</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => router.push("/login?redirect=/checkout")}
                    >
                      Đăng nhập
                    </button>
                  </div>
                )}

                {/* Promo Code */}
                <div className="checkout-promo">
                  <h3>Mã khuyến mãi</h3>
                  <div className="checkout-promo__input">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã khuyến mãi"
                    />
                    <button onClick={handleApplyPromo}>Áp dụng</button>
                  </div>
                  {promoMessage && (
                    <p className={`checkout-promo__message ${discount > 0 ? "success" : "error"}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="checkout-method">
                  <h3>Phương thức thanh toán</h3>
                  <div className="payment-methods">
                    <label className={`payment-option ${paymentMethod === "cash" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={e => setPaymentMethod(e.target.value)}
                      />
                      <span className="payment-option__icon">💵</span>
                      <span className="payment-option__name">Tiền mặt tại rạp</span>
                    </label>
                    <label className={`payment-option ${paymentMethod === "bank" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={e => setPaymentMethod(e.target.value)}
                      />
                      <span className="payment-option__icon">📱</span>
                      <span className="payment-option__name">Chuyển khoản QR</span>
                    </label>
                  </div>
                </div>

                {/* Total */}
                <div className="checkout-summary">
                  <div className="checkout-summary__row">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(displayTotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="checkout-summary__row checkout-summary__discount">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="checkout-summary__row checkout-summary__total">
                    <span>Tổng cộng:</span>
                    <strong>{formatPrice(finalTotal)}</strong>
                  </div>
                </div>

                {!qrPayment ? (
                  <button
                    className="btn btn-primary checkout-btn"
                    onClick={handleCheckout}
                    disabled={processing || !user || displayCart.length === 0}
                  >
                    {processing ? "Đang xử lý..." : `Thanh toán ${formatPrice(finalTotal)}`}
                  </button>
                ) : (
                  <div className="qr-payment-section">
                    <div className="qr-payment-header">
                      <div className="qr-payment-icon">📱</div>
                      <h3>Quét mã QR để thanh toán</h3>
                      <p className="qr-payment-subtitle">Sử dụng ứng dụng ngân hàng để quét mã</p>
                    </div>
                    
                    <div className="qr-code-wrapper">
                      <div className="qr-code-box">
                        <img src={qrPayment.qr_code} alt="QR Code thanh toán" className="qr-code-image" />
                      </div>
                      
                      <div className="qr-payment-amount">
                        <span>Số tiền cần chuyển</span>
                        <strong>{formatPrice(qrPayment.amount)}</strong>
                      </div>
                    </div>

                    <div className="qr-payment-details">
                      <div className="qr-detail-item">
                        <span className="qr-detail-label">🏦 Ngân hàng</span>
                        <span className="qr-detail-value">{qrPayment.bank_name}</span>
                      </div>
                      <div className="qr-detail-item">
                        <span className="qr-detail-label">💳 Số tài khoản</span>
                        <span className="qr-detail-value">{qrPayment.bank_account}</span>
                      </div>
                      <div className="qr-detail-item">
                        <span className="qr-detail-label">👤 Chủ tài khoản</span>
                        <span className="qr-detail-value">{qrPayment.account_name}</span>
                      </div>
                      <div className="qr-detail-item">
                        <span className="qr-detail-label">📝 Nội dung CK</span>
                        <span className="qr-detail-value qr-detail-code">LMK-{qrPayment.booking_code}</span>
                      </div>
                      <div className="qr-detail-item qr-detail-warning">
                        <span className="qr-detail-label">⏰ Thời gian còn lại</span>
                        <span className="qr-detail-value qr-countdown">
                          {timeLeft !== null ? (
                            <>
                              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                              {(timeLeft % 60).toString().padStart(2, '0')}
                            </>
                          ) : (
                            new Date(qrPayment.expires_at).toLocaleTimeString("vi-VN")
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="qr-payment-actions">
                      <button
                        className="btn btn-primary btn-confirm-payment"
                        onClick={async () => {
                          try {
                            // Gọi API xác nhận đã chuyển khoản
                            const res = await fetch("/api/payments/confirm-transfer", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                transaction_id: qrPayment.transaction_id 
                              })
                            });
                            
                            const data = await res.json();
                            
                            if (!res.ok) {
                              alert(data.error || "Lỗi xác nhận thanh toán");
                              return;
                            }
                            
                            // Xóa pending payment khi xác nhận thành công
                            localStorage.removeItem("lmk_pending_payment");
                            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            clearCart();
                            router.push("/checkout/success?pending=true&code=" + qrPayment.booking_code);
                          } catch (error) {
                            console.error("Error confirming transfer:", error);
                            alert("Lỗi xác nhận thanh toán. Vui lòng thử lại.");
                          }
                        }}
                      >
                        ✅ Tôi đã chuyển khoản
                      </button>
                      <button
                        className="btn btn-secondary btn-cancel-payment"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn hủy thanh toán? Đơn hàng sẽ bị hủy.")) {
                            localStorage.removeItem("lmk_pending_payment");
                            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            setQrPayment(null);
                            setBookingIds([]);
                            setSavedCartData(null);
                            setTimeLeft(null);
                            setCheckingPayment(false);
                          }
                        }}
                      >
                        ❌ Hủy thanh toán
                      </button>
                      <p className="qr-payment-note">
                        Sau khi bấm xác nhận, nhân viên sẽ kiểm tra và cập nhật trạng thái đơn hàng của bạn.
                        <br />
                        <strong>Lưu ý:</strong> Bạn có thể rời trang và quay lại để tiếp tục thanh toán trong thời gian còn lại.
                      </p>
                    </div>

                    {checkingPayment && (
                      <div className="payment-checking">
                        <div className="spinner"></div>
                        <p>Đang kiểm tra thanh toán...</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="checkout-note">
                  Bằng việc thanh toán, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> của LMK Cinema.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

