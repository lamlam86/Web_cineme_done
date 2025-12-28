"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "intl-tel-input/build/css/intlTelInput.css";

export default function SignupPage() {
  const router = useRouter();
  const phoneRef = useRef(null);
  const itiRef = useRef(null);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [policyChecked, setPolicyChecked] = useState(false);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Check if user is already logged in - redirect immediately
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        
        if (data.success && data.user) {
          router.replace("/");
        }
      } catch (e) {
        // Not logged in, continue showing signup form
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    (async () => {
      const intlTelInput = (await import("intl-tel-input")).default;
      if (phoneRef.current) {
        itiRef.current = intlTelInput(phoneRef.current, {
          initialCountry: "vn",
          separateDialCode: true,
          preferredCountries: ["vn", "us", "gb", "au", "de", "fr", "jp", "kr"],
          nationalMode: false,
          utilsScript:
            "https://cdn.jsdelivr.net/npm/intl-tel-input@17/build/js/utils.js",
        });
      }
    })();
    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
      }
    };
  }, []);

  // Countdown timer for redirect
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      router.push("/login");
    }
  }, [showSuccess, countdown, router]);

  const validateForm = () => {
    const newErrors = {};

    const fullnameRegex = /^[\p{L}\s]{2,}$/u;
    if (!fullname.trim()) {
      newErrors.fullname = "Vui lòng nhập họ và tên";
    } else if (!fullnameRegex.test(fullname.trim())) {
      newErrors.fullname = "Họ và tên phải hợp lệ, không chứa số.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Email không hợp lệ.";
    }

    if (phone.trim() && itiRef.current && !itiRef.current.isValidNumber()) {
      newErrors.phone = "Số điện thoại không hợp lệ cho quốc gia đã chọn.";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (!passwordRegex.test(password)) {
      newErrors.password = "Mật khẩu ≥8 ký tự, gồm hoa, thường, số, ký tự đặc biệt.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!policyChecked) {
      newErrors.policy = "Bạn phải đồng ý với chính sách.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError("");

    try {
      const phoneE164 = itiRef.current?.getNumber() || phone;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullname.trim(),
          email: email.trim(),
          phone: phoneE164,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success modal with user info
        setRegisteredUser({
          fullName: fullname.trim(),
          email: email.trim(),
          phone: phoneE164 || "Chưa cập nhật",
        });
        setShowSuccess(true);
      } else {
        setGeneralError(data.message);
      }
    } catch {
      setGeneralError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <>
      <Header />
      <main className="login-container">
        <div className="login-box">
          <h2>Tạo tài khoản mới</h2>

          {generalError && (
            <div className="general-error">{generalError}</div>
          )}

          <form id="signupForm" noValidate autoComplete="off" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="fullname">Họ và tên</label>
              <input
                id="fullname"
                placeholder="Nhập họ và tên"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                disabled={isLoading}
                className={errors.fullname ? "error" : ""}
              />
              {errors.fullname && <div className="error-message">{errors.fullname}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Địa chỉ Email</label>
              <input
                type="email"
                id="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <div className="phone-group">
                <input
                  ref={phoneRef}
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className={errors.phone ? "error" : ""}
                />
              </div>
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={errors.password ? "error" : ""}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={errors.confirmPassword ? "error" : ""}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="policy"
                  checked={policyChecked}
                  onChange={(e) => setPolicyChecked(e.target.checked)}
                  disabled={isLoading}
                  className={errors.policy ? "error" : ""}
                />
                <span>
                  Tôi đồng ý với <a href="/chinhsach" target="_blank">Chính sách bảo mật</a> và{" "}
                  <a href="/dieukhoan" target="_blank">Điều khoản sử dụng</a>.
                </span>
              </label>
              {errors.policy && <div className="error-message">{errors.policy}</div>}
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <p className="register-text">
            Đã có tài khoản? <a href="/login">Đăng nhập tại đây</a>
          </p>
        </div>
      </main>
      <Footer />

      {/* Success Modal */}
      {showSuccess && registeredUser && (
        <div className="signup-success-overlay">
          <div className="signup-success-modal">
            <div className="signup-success-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#22c55e"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h2 className="signup-success-title">Đăng ký thành công!</h2>
            <p className="signup-success-subtitle">Chào mừng bạn đến với LMK Cinema</p>

            <div className="signup-success-info">
              <div className="signup-info-row">
                <span className="signup-info-label">👤 Họ tên</span>
                <span className="signup-info-value">{registeredUser.fullName}</span>
              </div>
              <div className="signup-info-row">
                <span className="signup-info-label">📧 Email</span>
                <span className="signup-info-value">{registeredUser.email}</span>
              </div>
              <div className="signup-info-row">
                <span className="signup-info-label">📱 Điện thoại</span>
                <span className="signup-info-value">{registeredUser.phone}</span>
              </div>
            </div>

            <p className="signup-success-note">
              Bạn có thể đăng nhập ngay bằng email và mật khẩu đã đăng ký
            </p>

            <button className="signup-success-btn" onClick={goToLogin}>
              Đăng nhập ngay
            </button>

            <p className="signup-success-countdown">
              Tự động chuyển đến trang đăng nhập sau <strong>{countdown}</strong> giây
            </p>
          </div>
        </div>
      )}
    </>
  );
}
