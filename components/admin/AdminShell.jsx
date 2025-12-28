'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Base navigation sections - available to both admin and staff
const BASE_NAV_SECTIONS = [
  {
    title: 'Dashboard',
    items: [{ label: 'Tổng quan', href: '/admin' }],
  },
  {
    title: 'Quản lý nội dung',
    items: [
      { label: 'Quản lý phim', href: '/admin/movies' },
      { label: 'Quản lý lịch chiếu', href: '/admin/showtimes' },
      { label: 'Bảng giá vé', href: '/admin/ticket-prices' },
      { label: 'Quản lý rạp', href: '/admin/cinemas' },
      { label: 'Quản lý phòng chiếu', href: '/admin/screens' },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Đơn hàng / Vé', href: '/admin/orders' },
      { label: 'Quét vé QR', href: '/admin/scan-ticket' },
      { label: 'Khách hàng', href: '/admin/customers' },
    ],
  },
  {
    title: 'Gói ưu đãi',
    items: [
      { label: 'Combo bắp nước', href: '/admin/combos' },
      { label: 'Khuyến mãi', href: '/admin/promotions' },
    ],
  },
];

// Admin-only section
const ADMIN_ONLY_SECTION = {
  title: 'Quản lý tài khoản',
  items: [
    { label: 'Nhân viên', href: '/admin/staff' },
    { label: 'Admin', href: '/admin/admins' },
  ],
};

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success && data.user) {
          const roles = data.user.roles || [];
          const isAdminOrStaff = roles.includes('admin') || roles.includes('staff');
          
          if (!isAdminOrStaff) {
            router.push('/');
            return;
          }
          
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.roles?.includes('admin');
  const navSections = isAdmin 
    ? [...BASE_NAV_SECTIONS, ADMIN_ONLY_SECTION]
    : BASE_NAV_SECTIONS;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/" className="admin-brand__title">LMK CINEMA</Link>
          <small>Bảng điều khiển</small>
        </div>

        {navSections.map(section => (
          <div key={section.title} className="admin-nav-group">
            <p className="admin-nav-group__title">{section.title}</p>
            <div className="admin-nav-group__list">
              {section.items.map(item => {
                const isActive =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href) && item.href !== '/admin');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link${isActive ? ' is-active' : ''}`}
                  >
                    <span>{item.label}</span>
                    {item.badge && <em>{item.badge}</em>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <div className="admin-content">
        <header className="admin-content__header">
          <div>
            <p className="admin-eyebrow">
              Xin chào, {isAdmin ? 'quản trị viên' : 'nhân viên'}!
            </p>
            <h1>Bảng điều khiển</h1>
          </div>

          <div className="admin-header-user">
            <div className="admin-user-avatar">
              {getInitials(user.fullName)}
            </div>
            <div>
              <p className="admin-user-name">{user.fullName}</p>
              <small>{user.email}</small>
            </div>
            <span className={`admin-role-badge ${isAdmin ? 'admin-role-badge--admin' : 'admin-role-badge--staff'}`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
            <button 
              onClick={handleLogout}
              className="admin-logout-btn"
              title="Đăng xuất"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        <div className="admin-content__body">{children}</div>
      </div>
    </div>
  );
}

