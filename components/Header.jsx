"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { setIsOpen, getCartCount } = useCart();
  const cartCount = getCartCount();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch {
        // Not logged in
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setDropdownOpen(false);
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

  return (
    <header className="header" role="banner">
      <div className="header__container">
        <nav className="header__navbar" aria-label="Primary">
                  <Link href="/" className="header__logo" aria-label="Trang chủ">
            <img
              src="/assets/images/logo.png"
              alt="Cinemas"
              width={140}
            />
          </Link>

          <div className="header__cta" role="group" aria-label="Đặt nhanh">
            <Link href="/movie" className="btn-cta btn-cta--solid">
              <img src="/assets/images/ic-ticket.svg" alt="" className="icon icon-20" aria-hidden="true" />
              <span>ĐẶT VÉ NGAY</span>
            </Link>

            <Link href="/popcorn-drink" className="btn-cta btn-cta--solid">
              <img src="/assets/images/ic-cor.svg" alt="" className="icon icon-20" aria-hidden="true" />
              <span>ĐẶT BẮP NƯỚC</span>
            </Link>
          </div>

          <div className="header__right">
            <MobileMenu />

            <form className="header__search" action="/search" method="GET" role="search">
              <input
                type="search"
                name="q"
                placeholder="Tìm phim, rạp..."
                className="header__search-input"
                aria-label="Tìm phim, rạp"
                autoComplete="off"
              />
              <button className="header__search-btn" type="submit" aria-label="Tìm kiếm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
              </button>
            </form>

            {loading ? (
              <div className="header__auth-loading">
                <span className="loading-spinner"></span>
              </div>
            ) : user ? (
              <>
                {/* Cart Button - chỉ hiện khi đã đăng nhập */}
                <button 
                  className="header__cart-btn"
                  onClick={() => setIsOpen(true)}
                  aria-label="Giỏ hàng"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartCount > 0 && (
                    <span className="header__cart-badge">{cartCount}</span>
                  )}
                </button>

                {/* Nút Admin Panel nổi bật cho admin/staff */}
                {(user.roles?.includes("admin") || user.roles?.includes("staff")) && (
                  <Link href="/admin" className="btn-admin-panel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span>Quản lý</span>
                  </Link>
                )}
                
                <div className="header__user" ref={dropdownRef}>
                  <button
                    className="header__user-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="header__user-avatar"
                      />
                    ) : (
                      <div className="header__user-avatar header__user-avatar--initials">
                        {getInitials(user.fullName)}
                      </div>
                    )}
                    <span className="header__user-name">{user.fullName}</span>
                    <svg
                      className={`header__user-chevron ${dropdownOpen ? "open" : ""}`}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                {dropdownOpen && (
                  <div className="header__dropdown">
                    <div className="header__dropdown-header">
                      <p className="header__dropdown-name">{user.fullName}</p>
                      <p className="header__dropdown-email">{user.email}</p>
                    </div>
                    <div className="header__dropdown-divider"></div>
                    <Link
                      href="/profile"
                      className="header__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Tài khoản của tôi
                    </Link>
                    <Link
                      href="/my-tickets"
                      className="header__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 9a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3m20-7a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3M13 5V3m0 18v-2m4-11h2m-2 8h2M5 8h2m0 8H5m4-8h6v8H9z"></path>
                      </svg>
                      Vé của tôi
                    </Link>
                    {(user.roles.includes("admin") || user.roles.includes("staff")) && (
                      <Link
                        href="/admin"
                        className="header__dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        Bảng điều khiển
                      </Link>
                    )}
                    <div className="header__dropdown-divider"></div>
                    <button
                      className="header__dropdown-item header__dropdown-item--logout"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <ul className="header__navbar-list" role="menubar" aria-label="Tài khoản">
                <li className="header__navbar-item" role="none">
                  <Link className="btn-cta btn-cta--solid" href="/login" role="menuitem">
                    Đăng nhập
                  </Link>
                </li>
                <li className="header__navbar-item" role="none">
                  <Link className="btn-cta btn-cta--solid" href="/signup" role="menuitem">
                    Đăng ký
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </nav>
      </div>

      <div className="header__subnav" role="navigation" aria-label="Danh mục phụ">
        <div className="header__container header__subnav-inner">
          <ul className="header__subnav-list">
            <li><Link href="/he-thong-rap" className="header__subnav-link">Chọn rạp</Link></li>
            <li><Link href="/lich-chieu" className="header__subnav-link">Lịch chiếu</Link></li>
            <li><Link href="/chuong-trinh-khuyen-mai" className="header__subnav-link">Khuyến mãi</Link></li>
            <li><Link href="/to-chuc-su-kien" className="header__subnav-link">Tổ chức sự kiện</Link></li>
            <li><Link href="/dich-vu-giai-tri" className="header__subnav-link">Dịch vụ giải trí khác</Link></li>
            <li><Link href="/gioi-thieu" className="header__subnav-link">Giới thiệu</Link></li>
          </ul>
        </div>
      </div>
    </header>
  );
}

