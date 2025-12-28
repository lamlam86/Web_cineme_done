"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: nhập email, 2: đã gửi email

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Email không hợp lệ");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setMessage("");

    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
        setMessage(data.message);
      } else {
        setMessage(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      setMessage("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="login-container">
        <div className="login-box">
          {step === 1 ? (
            <>
              <h2>Quên mật khẩu</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Nhập email của bạn để nhận link đặt lại mật khẩu
              </p>

              {message && (
                <div className={`general-error ${message.includes("thành công") || message.includes("gửi") ? "success" : ""}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Nhập email đăng ký"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  {emailError && <div className="error-message">{emailError}</div>}
                </div>

                <button type="submit" className="btn-login" disabled={isLoading}>
                  {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                </button>
              </form>

              <p className="register-text">
                Nhớ mật khẩu? <Link href="/login">Đăng nhập</Link>
              </p>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "64px", marginBottom: "20px" }}>📧</div>
                <h2>Đã gửi email!</h2>
                <p style={{ color: "var(--text-muted)", margin: "20px 0" }}>
                  Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong>{email}</strong>
                </p>
                <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "30px" }}>
                  Vui lòng kiểm tra hộp thư (cả thư mục spam) và làm theo hướng dẫn trong email.
                </p>
                <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginBottom: "30px" }}>
                  Link sẽ hết hạn sau 1 giờ.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    className="btn-login"
                    onClick={() => {
                      setStep(1);
                      setEmail("");
                      setMessage("");
                    }}
                  >
                    Gửi lại email
                  </button>
                  <Link href="/login" className="btn-login" style={{ textDecoration: "none", display: "inline-block" }}>
                    Về trang đăng nhập
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}





