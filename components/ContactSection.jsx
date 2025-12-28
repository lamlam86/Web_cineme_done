"use client";
import { useState } from "react";

export default function ContactSection() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setFormSuccess(true);
      setContactForm({ name: "", email: "", message: "" });
      setSending(false);
      setTimeout(() => setFormSuccess(false), 3000);
    }, 1000);
  };

  return (
    <section className="contact-section">
      <div className="container">
        <div className="contact-grid">
          {/* Social Links */}
          <div className="contact-left">
            <h2>LIÊN HỆ VỚI CHÚNG TÔI</h2>
            <p className="contact-subtitle">Kết nối ngay để nhận ưu đãi mới nhất</p>
            <a href="https://facebook.com/lmkcinema" target="_blank" rel="noopener noreferrer" className="contact-social-btn">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>FACEBOOK</span>
            </a>
            <a href="https://zalo.me/0948116717" target="_blank" rel="noopener noreferrer" className="contact-social-btn contact-social-btn--zalo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.168-.397-.262-.662-.262h-2.09c-.264 0-.492.094-.662.262-.168.168-.262.397-.262.662v4.356c0 .264.094.492.262.662.17.168.398.262.662.262h2.09c.265 0 .493-.094.662-.262.168-.17.262-.398.262-.662V8.822c0-.265-.094-.494-.262-.662zM6.82 8.16c-.168-.168-.397-.262-.662-.262H4.068c-.264 0-.492.094-.662.262-.168.168-.262.397-.262.662v4.356c0 .264.094.492.262.662.17.168.398.262.662.262h2.09c.265 0 .493-.094.662-.262.168-.17.262-.398.262-.662V8.822c0-.265-.094-.494-.262-.662zm5.59 0c-.168-.168-.397-.262-.662-.262H9.658c-.264 0-.492.094-.662.262-.168.168-.262.397-.262.662v4.356c0 .264.094.492.262.662.17.168.398.262.662.262h2.09c.265 0 .493-.094.662-.262.168-.17.262-.398.262-.662V8.822c0-.265-.094-.494-.262-.662z"/>
              </svg>
              <span>ZALO: 0948 116 717</span>
            </a>
            <a href="https://youtube.com/@lmkcinema" target="_blank" rel="noopener noreferrer" className="contact-social-btn contact-social-btn--youtube">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YOUTUBE</span>
            </a>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h3>THÔNG TIN LIÊN HỆ</h3>
            <div className="contact-info">
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>cskh@lmkcinema.vn</span>
              </div>
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Zalo: 0948 116 717</span>
              </div>
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>84 Man Thiện, P. Hiệp Phú, TP. Thủ Đức</span>
              </div>
            </div>
            
            {formSuccess ? (
              <div className="contact-form-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>Cảm ơn bạn đã liên hệ!</p>
                <span>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                />
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={contactForm.email}
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                />
                <textarea
                  placeholder="Nội dung tin nhắn..."
                  rows={4}
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                />
                <button type="submit" disabled={sending}>
                  {sending ? (
                    <>
                      <span className="spinner"></span>
                      ĐANG GỬI...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      GỬI NGAY
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}








