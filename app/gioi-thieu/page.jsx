import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="app">
      <Header />
      <main className="about-page">
        <div className="container">
          <h1 className="page-title">GIỚI THIỆU LMK CINEMA</h1>

          {/* Hero Section */}
          <section className="about-hero">
            <div className="about-hero__content">
              <h2>Hệ thống rạp chiếu phim hàng đầu Việt Nam</h2>
              <p>
                LMK Cinema được thành lập với sứ mệnh mang đến trải nghiệm điện ảnh đẳng cấp cho khán giả Việt Nam. 
                Với hệ thống rạp hiện đại trải dài khắp cả nước, chúng tôi cam kết mang đến những bộ phim hay nhất 
                cùng dịch vụ chất lượng cao.
              </p>
            </div>
          </section>

          {/* Stats */}
          <section className="about-stats">
            <div className="stat-item">
              <span className="stat-number">12+</span>
              <span className="stat-label">Rạp chiếu phim</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">36+</span>
              <span className="stat-label">Phòng chiếu</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5000+</span>
              <span className="stat-label">Ghế ngồi</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1M+</span>
              <span className="stat-label">Khách hàng</span>
            </div>
          </section>

          {/* Features */}
          <section className="about-features">
            <h2 className="section-title">Tại sao chọn LMK Cinema?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎬</div>
                <h3>Phim bom tấn</h3>
                <p>Cập nhật những bộ phim mới nhất từ Hollywood và điện ảnh Việt Nam</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔊</div>
                <h3>Âm thanh Dolby</h3>
                <p>Hệ thống âm thanh vòm Dolby Atmos cho trải nghiệm sống động</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📽️</div>
                <h3>Màn hình IMAX</h3>
                <p>Màn hình khổng lồ IMAX cho hình ảnh sắc nét, chân thực</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛋️</div>
                <h3>Ghế ngồi cao cấp</h3>
                <p>Ghế da cao cấp có thể ngả, ghế đôi lãng mạn cho các cặp đôi</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🍿</div>
                <h3>Đồ ăn đa dạng</h3>
                <p>Bắp rang, nước ngọt và nhiều món ăn nhẹ hấp dẫn</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎁</div>
                <h3>Ưu đãi hấp dẫn</h3>
                <p>Nhiều chương trình khuyến mãi và ưu đãi thành viên</p>
              </div>
            </div>
          </section>

          {/* Mission */}
          <section className="about-mission">
            <div className="mission-card">
              <h3>Sứ mệnh</h3>
              <p>Mang đến trải nghiệm điện ảnh đẳng cấp, góp phần làm phong phú đời sống văn hóa tinh thần cho người Việt Nam.</p>
            </div>
            <div className="mission-card">
              <h3>Tầm nhìn</h3>
              <p>Trở thành hệ thống rạp chiếu phim được yêu thích nhất Việt Nam, tiên phong trong ứng dụng công nghệ điện ảnh mới.</p>
            </div>
            <div className="mission-card">
              <h3>Giá trị cốt lõi</h3>
              <p>Chất lượng - Sáng tạo - Tận tâm - Trách nhiệm với cộng đồng.</p>
            </div>
          </section>

          {/* Contact Info */}
          <section className="about-contact">
            <h2 className="section-title">Liên hệ với chúng tôi</h2>
            <div className="contact-info">
              <div className="contact-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Hotline: 1900 00000</span>
              </div>
              <div className="contact-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>Email: support@cinestar.vn</span>
              </div>
              <div className="contact-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Giờ làm việc: 8:00 - 23:00</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

