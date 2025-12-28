"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Link không hợp lệ hoặc đã hết hạn");
    }
  }, [token]);

  const validateForm = () => {
    let valid = true;
    setPasswordError("");
    setConfirmPasswordError("");

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Mật khẩu tối thiểu 8 ký tự");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) return;
    if (!token) {
      setMessage("Link không hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setMessage(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      setMessage("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <main className="login-container">
          <div className="login-box">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
              <h2>Đặt lại mật khẩu thành công!</h2>
              <p style={{ color: "var(--text-muted)", margin: "20px 0" }}>
                Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...
              </p>
              <Link href="/login" className="btn-login" style={{ textDecoration: "none", display: "inline-block" }}>
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="login-container">
        <div className="login-box">
          <h2>Đặt lại mật khẩu</h2>

          {message && (
            <div className={`general-error ${message.includes("thành công") ? "success" : ""}`}>
              {message}
            </div>
          )}

          {!token ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "var(--text-muted)" }}>
                Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
              </p>
              <Link href="/forgot-password" className="btn-login" style={{ textDecoration: "none", display: "inline-block", marginTop: "20px" }}>
                Yêu cầu link mới
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label htmlFor="password">Mật khẩu mới</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {passwordError && <div className="error-message">{passwordError}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
              </div>

              <button type="submit" className="btn-login" disabled={isLoading || !token}>
                {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          <p className="register-text">
            <Link href="/login">Quay lại đăng nhập</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}





