"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const SERVICES = [
  {
    id: 1,
    title: "Karaoke Box",
    description: "Phòng karaoke hiện đại trong khuôn viên rạp chiếu phim",
    icon: "🎤",
    features: ["Phòng VIP", "Hệ thống âm thanh JBL", "Màn hình cảm ứng", "Đồ ăn nhẹ"],
    price: "150,000 VND/giờ",
  },
  {
    id: 2,
    title: "Game Zone",
    description: "Khu vực trò chơi điện tử với máy game mới nhất",
    icon: "🎮",
    features: ["PlayStation 5", "Xbox Series X", "Racing Simulator", "VR Experience"],
    price: "từ 50,000 VND/lượt",
  },
  {
    id: 3,
    title: "Kidzone",
    description: "Khu vui chơi an toàn dành riêng cho trẻ em",
    icon: "🎠",
    features: ["Nhà bóng", "Cầu trượt", "Xếp hình LEGO", "Nhân viên trông trẻ"],
    price: "100,000 VND/2 giờ",
  },
  {
    id: 4,
    title: "Bowling",
    description: "Bowling chuyên nghiệp với lane tiêu chuẩn quốc tế",
    icon: "🎳",
    features: ["6 làn bowling", "Giày bowling", "Bảng điểm tự động", "Huấn luyện viên"],
    price: "80,000 VND/game",
  },
  {
    id: 5,
    title: "Billiards",
    description: "Bàn bi-a cao cấp trong không gian sang trọng",
    icon: "🎱",
    features: ["Bàn Brunswick", "Đèn chuyên dụng", "Không gian riêng tư", "Đồ uống"],
    price: "60,000 VND/giờ",
  },
  {
    id: 6,
    title: "Photo Booth",
    description: "Khu vực chụp ảnh với nhiều backdrop và props",
    icon: "📸",
    features: ["Background đa dạng", "Props vui nhộn", "In ảnh tại chỗ", "Gửi email/share"],
    price: "50,000 VND/4 ảnh",
  },
];

const HOTLINE = "1900 00000";
const EMAIL = "services@lmkcinema.vn";

export default function EntertainmentPage() {
  return (
    <div className="app">
      <Header />
      <main className="entertainment-page">
        <div className="container">
          <h1 className="page-title">DỊCH VỤ GIẢI TRÍ KHÁC</h1>
          <p className="page-subtitle">Không chỉ là rạp chiếu phim - LMK Cinema là điểm đến giải trí toàn diện</p>

          {/* Hotline Banner */}
          <div className="contact-banner">
            <div className="contact-banner__icon">📞</div>
            <div className="contact-banner__content">
              <h3>Đặt dịch vụ qua Hotline</h3>
              <p>Liên hệ ngay để được tư vấn và đặt lịch</p>
            </div>
            <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="contact-banner__btn">
              {HOTLINE}
            </a>
          </div>

          <div className="services-grid">
            {SERVICES.map(service => (
              <div key={service.id} className="service-card">
                <div className="service-card__icon">{service.icon}</div>
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__desc">{service.description}</p>
                <ul className="service-card__features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <p className="service-card__price">{service.price}</p>
                <div className="service-card__actions">
                  <a 
                    href={`tel:${HOTLINE.replace(/\s/g, '')}`}
                    className="service-card__btn service-card__btn--primary"
                  >
                    📞 Gọi đặt ngay
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Banner */}
          <section className="entertainment-promo">
            <div className="promo-content">
              <h2>🎉 COMBO GIẢI TRÍ</h2>
              <p>Mua vé xem phim + sử dụng dịch vụ khác được giảm 20%</p>
              <Link href="/chuong-trinh-khuyen-mai" className="btn-cta btn-cta--solid">
                Xem chi tiết
              </Link>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="events-cta">
            <h2>Cần hỗ trợ thêm?</h2>
            <p>Liên hệ với chúng tôi để được tư vấn chi tiết</p>
            <div className="events-cta__contact">
              <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="btn-cta btn-cta--solid">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {HOTLINE}
              </a>
              <a href={`mailto:${EMAIL}`} className="btn-cta btn-cta--ghost">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {EMAIL}
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
