"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminManagementPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Check if user is admin
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user?.roles?.includes("admin")) {
          setIsAdmin(true);
          fetchAdmins();
        } else {
          // Not admin, redirect to main admin page
          router.push("/admin");
        }
      } catch (err) {
        router.push("/admin");
      }
    }
    checkAdmin();
  }, [router]);

  async function fetchAdmins() {
    try {
      const res = await fetch(`/api/admin/users?role=admin&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setAdmins(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "admin"
    });
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: "admin"
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        setMessage({ type: "success", text: "Cập nhật thành công!" });
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        setMessage({ type: "success", text: "Tạo tài khoản thành công!" });
      }
      
      fetchAdmins();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Bạn có chắc muốn xóa admin "${user.full_name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleStatus(user) {
    const newStatus = user.status === "active" ? "blocked" : "active";
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredAdmins = admins.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  // Show loading while checking admin status
  if (!isAdmin) {
    return (
      <div className="admin-loading">
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">Quản lý Admin</h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm Admin
          </button>
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder="Tìm kiếm admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search"
          />
        </div>

        {loading ? (
          <div className="admin-loading">Đang tải...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-empty">Chưa có admin nào</td>
                  </tr>
                ) : (
                  filteredAdmins.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar admin-avatar--admin">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" />
                            ) : (
                              user.full_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{user.full_name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || "-"}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${user.status}`}>
                          {user.status === "active" ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn"
                            title="Sửa"
                            onClick={() => openEditModal(user)}
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-action-btn"
                            title={user.status === "active" ? "Khóa" : "Mở khóa"}
                            onClick={() => toggleStatus(user)}
                          >
                            {user.status === "active" ? "🔒" : "🔓"}
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            title="Xóa"
                            onClick={() => handleDelete(user)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal__header">
                <h2>{editingUser ? "Sửa Admin" : "Thêm Admin mới"}</h2>
                <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="admin-modal__body">
                {message.text && (
                  <div className={`admin-message admin-message--${message.type}`}>
                    {message.text}
                  </div>
                )}
                
                <div className="admin-form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>{editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="admin-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : (editingUser ? "Cập nhật" : "Tạo tài khoản")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}

