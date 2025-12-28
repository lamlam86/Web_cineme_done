"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const isPending = searchParams.get("pending") === "true";
  const bookingCode = searchParams.get("code");

  return (
    <div className="success-card">
      {isPending ? (
        <>
          <div className="success-icon pending-icon">⏳</div>
          <h1>Đơn hàng đang chờ xác nhận!</h1>
          <p>
            Cảm ơn bạn đã đặt vé tại LMK Cinema.
          </p>
          
          {bookingCode && (
            <div className="booking-code-display">
              <span>Mã đơn hàng của bạn:</span>
              <strong>{bookingCode}</strong>
            </div>
          )}

          <div className="pending-notice">
            <div className="pending-notice-icon">📋</div>
            <div className="pending-notice-content">
              <h4>Thanh toán đang được xử lý</h4>
              <p>
                Nhân viên sẽ kiểm tra giao dịch chuyển khoản và xác nhận đơn hàng của bạn trong thời gian sớm nhất.
              </p>
              <p>
                Bạn có thể kiểm tra trạng thái đơn hàng trong mục <strong>"Vé của tôi"</strong>.
              </p>
            </div>
          </div>
          
          <div className="success-actions">
            <Link href="/my-tickets" className="btn btn-primary">
              Xem vé của tôi
            </Link>
            <Link href="/" className="btn btn-secondary">
              Về trang chủ
            </Link>
          </div>

          <div className="success-tips">
            <h3>Lưu ý quan trọng:</h3>
            <ul>
              <li>Đơn hàng sẽ được xác nhận sau khi nhân viên kiểm tra thanh toán</li>
              <li>Nếu sau 30 phút chưa được xác nhận, vui lòng liên hệ hotline</li>
              <li>Vé chỉ có hiệu lực sau khi trạng thái chuyển sang "Đã xác nhận"</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="success-icon">✅</div>
          <h1>Đặt vé thành công!</h1>
          <p>
            Cảm ơn bạn đã đặt vé tại LMK Cinema. 
            Thông tin vé đã được gửi đến email của bạn.
          </p>
          
          <div className="success-actions">
            <Link href="/my-tickets" className="btn btn-primary">
              Xem vé của tôi
            </Link>
            <Link href="/" className="btn btn-secondary">
              Về trang chủ
            </Link>
          </div>

          <div className="success-tips">
            <h3>Lưu ý:</h3>
            <ul>
              <li>Vui lòng đến rạp trước giờ chiếu 15-30 phút</li>
              <li>Xuất trình mã QR hoặc email xác nhận tại quầy vé</li>
              <li>Mang theo CCCD/CMND nếu mua vé ưu đãi học sinh/sinh viên</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="success-card">
      <div className="success-icon">⏳</div>
      <h1>Đang tải...</h1>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="app">
      <Header />
      <main className="checkout-success-page">
        <div className="container">
          <Suspense fallback={<LoadingFallback />}>
            <CheckoutSuccessContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
