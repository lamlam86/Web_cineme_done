"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setFullName(data.user.fullName);
        setPhone(data.user.phone || "");
        setDateOfBirth(data.user.dateOfBirth ? data.user.dateOfBirth.split("T")[0] : "");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, dateOfBirth: dateOfBirth || null }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setUser((prev) => (prev ? { ...prev, fullName, phone, dateOfBirth } : null));
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Không thể kết nối đến server" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage({ type: "success", text: data.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.message });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Không thể kết nối đến server" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      console.error("Logout failed");
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="profile-page">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null;
  }

  const maxPoints = 10000;
  const userPoints = user.points ?? 0;
  const pointsPercent = Math.min((userPoints / maxPoints) * 100, 100);

  return (
    <>
      <Header />
      <main className="profile-page">
        <div className="profile-container">
          <aside className="profile-sidebar">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar profile-avatar--initials">
                    {getInitials(user.fullName)}
                  </div>
                )}
              </div>
              <h2 className="profile-name">{user.fullName}</h2>
              <button className="profile-change-avatar" onClick={() => fileInputRef.current?.click()}>
                Thay đổi ảnh đại diện
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  console.log(e.target.files);
                }}
              />
            </div>

            <button className="profile-membership-btn">
              C&apos;Friends
            </button>

            <div className="profile-points">
              <span className="profile-points-label">Tích điểm C&apos;Friends</span>
              <div className="profile-points-bar">
                <div className="profile-points-fill" style={{ width: `${pointsPercent}%` }}></div>
              </div>
              <span className="profile-points-value">{userPoints.toLocaleString()}/10K</span>
            </div>

            <nav className="profile-nav">
              <button className="profile-nav-item active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Thông tin khách hàng
              </button>
              <button className="profile-nav-item" onClick={() => router.push("/membership")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Thành viên LMK Cinema
              </button>
              <button className="profile-nav-item" onClick={() => router.push("/my-tickets")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Lịch sử mua hàng
              </button>
            </nav>

            <button className="profile-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Đăng xuất
            </button>
          </aside>

          <div className="profile-main">
            <h1 className="profile-title">THÔNG TIN KHÁCH HÀNG</h1>

            <div className="profile-card">
              <h3 className="profile-card-title">Thông tin cá nhân</h3>
              
              {message && (
                <div className={`profile-alert profile-alert--${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      disabled={saving}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="dateOfBirth">Ngày sinh</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      disabled={saving}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      disabled
                      className="disabled"
                    />
                  </div>
                </div>

                <button type="submit" className="profile-submit-btn" disabled={saving}>
                  {saving ? "ĐANG LƯU..." : "LƯU THÔNG TIN"}
                </button>
              </form>
            </div>

            <div className="profile-card">
              <h3 className="profile-card-title">Đổi mật khẩu</h3>

              {passwordMessage && (
                <div className={`profile-alert profile-alert--${passwordMessage.type}`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="profile-form-group">
                  <label htmlFor="currentPassword">
                    Mật khẩu cũ <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    disabled={savingPassword}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="newPassword">
                    Mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    disabled={savingPassword}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="confirmPassword">
                    Xác thực mật khẩu <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={savingPassword}
                  />
                </div>

                <button type="submit" className="profile-submit-btn" disabled={savingPassword}>
                  {savingPassword ? "ĐANG XỬ LÝ..." : "ĐỔI MẬT KHẨU"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

