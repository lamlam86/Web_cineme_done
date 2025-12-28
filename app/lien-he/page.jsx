"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HOTLINE = "1900 00000";
const EMAIL = "cskh@lmkcinema.vn";
const ZALO = "0948 116 717";

const BRANCHES = [
  {
    id: 1,
    name: "LMK Cinema Man Thiện",
    address: "84 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM",
    phone: "028 1234 5678",
    hours: "8:00 - 24:00",
    map: "https://maps.google.com/?q=84+Man+Thien+Thu+Duc",
  },
  {
    id: 2,
    name: "LMK Cinema Vincom Thủ Đức",
    address: "Tầng 5, TTTM Vincom Plaza Thủ Đức, 216 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    phone: "028 2345 6789",
    hours: "9:00 - 23:00",
    map: "https://maps.google.com/?q=Vincom+Thu+Duc",
  },
  {
    id: 3,
    name: "LMK Cinema AEON Bình Dương",
    address: "Tầng 3, AEON Mall Bình Dương, Số 1 Đại lộ Bình Dương, TX. Thuận An, Bình Dương",
    phone: "0274 123 4567",
    hours: "9:00 - 22:00",
    map: "https://maps.google.com/?q=AEON+Binh+Duong",
  },
  {
    id: 4,
    name: "LMK Cinema Bình Dương",
    address: "123 Đại lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương",
    phone: "0274 234 5678",
    hours: "8:30 - 23:00",
    map: "https://maps.google.com/?q=Thu+Dau+Mot+Binh+Duong",
  },
];

const FAQS = [
  {
    q: "Làm sao để đặt vé online?",
    a: "Bạn có thể đặt vé trực tiếp trên website hoặc ứng dụng LMK Cinema. Chọn phim → Chọn suất chiếu → Chọn ghế → Thanh toán. Vé sẽ được gửi qua email và hiển thị trong mục 'Vé của tôi'."
  },
  {
    q: "Tôi có thể hủy/đổi vé không?",
    a: "Vé đã mua không được hoàn/hủy. Tuy nhiên, bạn có thể đổi suất chiếu trước giờ chiếu 2 tiếng bằng cách liên hệ hotline 1900 00000."
  },
  {
    q: "Trẻ em bao nhiêu tuổi được miễn phí?",
    a: "Trẻ em dưới 0.9m được miễn phí vé nhưng phải ngồi cùng người lớn. Trẻ từ 0.9m trở lên cần mua vé riêng."
  },
  {
    q: "Rạp có chỗ đỗ xe không?",
    a: "Tất cả các rạp LMK Cinema đều có bãi đỗ xe máy và ô tô. Khách xem phim được miễn phí gửi xe trong thời gian xem phim."
  },
  {
    q: "Làm sao để nhận ưu đãi thành viên?",
    a: "Đăng ký tài khoản trên website/app để tự động trở thành thành viên. Tích điểm mỗi lần mua vé để nhận ưu đãi và quà tặng."
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="app">
      <Header />
      <main className="contact-page">
        <div className="container">
          <h1 className="page-title">LIÊN HỆ</h1>
          <p className="page-subtitle">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>

          {/* Contact Info Cards */}
          <section className="contact-info-section">
            <div className="contact-info-grid">
              <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="contact-info-card">
                <span className="contact-info-icon">📞</span>
                <h3>Hotline</h3>
                <p className="contact-info-value">{HOTLINE}</p>
                <span className="contact-info-note">Hỗ trợ 24/7</span>
              </a>
              <a href={`mailto:${EMAIL}`} className="contact-info-card">
                <span className="contact-info-icon">📧</span>
                <h3>Email</h3>
                <p className="contact-info-value">{EMAIL}</p>
                <span className="contact-info-note">Phản hồi trong 24h</span>
              </a>
              <a href={`https://zalo.me/${ZALO.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="contact-info-card">
                <span className="contact-info-icon">💬</span>
                <h3>Zalo</h3>
                <p className="contact-info-value">{ZALO}</p>
                <span className="contact-info-note">Chat trực tiếp</span>
              </a>
              <div className="contact-info-card">
                <span className="contact-info-icon">🏢</span>
                <h3>Văn phòng</h3>
                <p className="contact-info-value">84 Man Thiện, TP.HCM</p>
                <span className="contact-info-note">T2-T6: 8:00 - 17:30</span>
              </div>
            </div>
          </section>

          {/* Branches */}
          <section className="contact-branches">
            <h2>Hệ thống rạp</h2>
            <div className="branches-grid">
              {BRANCHES.map(branch => (
                <div key={branch.id} className="branch-card">
                  <h3>{branch.name}</h3>
                  <div className="branch-info">
                    <p><span>📍</span> {branch.address}</p>
                    <p><span>📞</span> {branch.phone}</p>
                    <p><span>🕐</span> {branch.hours}</p>
                  </div>
                  <a href={branch.map} target="_blank" rel="noopener noreferrer" className="branch-map-btn">
                    Xem bản đồ →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section className="contact-form-section">
            <div className="contact-form-wrapper">
              <div className="contact-form-info">
                <h2>Gửi tin nhắn cho chúng tôi</h2>
                <p>Bạn có câu hỏi, góp ý hoặc khiếu nại? Hãy để lại tin nhắn, chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
                <div className="contact-form-illustration">
                  <span>🎬</span>
                </div>
              </div>
              <form className="contact-form" onSubmit={handleSubmit}>
                {submitted ? (
                  <div className="contact-form-success">
                    <span>✅</span>
                    <h3>Gửi thành công!</h3>
                    <p>Chúng tôi sẽ liên hệ lại với bạn sớm nhất.</p>
                  </div>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Họ tên *</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          required 
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div className="form-group">
                        <label>Số điện thoại *</label>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          required 
                          placeholder="0901234567"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required 
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Chủ đề</label>
                      <select 
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                      >
                        <option value="">-- Chọn chủ đề --</option>
                        <option value="booking">Hỗ trợ đặt vé</option>
                        <option value="refund">Hoàn/đổi vé</option>
                        <option value="feedback">Góp ý dịch vụ</option>
                        <option value="complaint">Khiếu nại</option>
                        <option value="partnership">Hợp tác kinh doanh</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nội dung *</label>
                      <textarea 
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        required 
                        rows={5}
                        placeholder="Nhập nội dung tin nhắn..."
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary contact-submit-btn">
                      Gửi tin nhắn
                    </button>
                  </>
                )}
              </form>
            </div>
          </section>

          {/* FAQ */}
          <section className="contact-faq">
            <h2>Câu hỏi thường gặp</h2>
            <div className="faq-list">
              {FAQS.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`faq-item ${expandedFaq === idx ? 'faq-item--expanded' : ''}`}
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    <span className="faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
                  </div>
                  {expandedFaq === idx && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

