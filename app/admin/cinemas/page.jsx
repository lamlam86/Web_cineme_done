"use client";
import { useState, useEffect } from "react";

export default function AdminCinemasPage() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    hotline: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCinemas();
  }, []);

  async function fetchCinemas() {
    try {
      const res = await fetch(`/api/admin/cinemas?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setCinemas(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCinema(null);
    setFormData({ name: "", address: "", city: "", hotline: "" });
    setShowModal(true);
  }

  function openEditModal(cinema) {
    setEditingCinema(cinema);
    setFormData({
      name: cinema.name,
      address: cinema.address || "",
      city: cinema.city || "",
      hotline: cinema.hotline || ""
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingCinema) {
        const res = await fetch(`/api/admin/cinemas/${editingCinema.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Cập nhật thành công!" });
      } else {
        const res = await fetch("/api/admin/cinemas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Tạo rạp thành công!" });
      }
      
      fetchCinemas();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cinema) {
    if (!confirm(`Bạn có chắc muốn xóa rạp "${cinema.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/cinemas/${cinema.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchCinemas();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredCinemas = cinemas.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: cinemas.length,
    totalScreens: cinemas.reduce((sum, c) => sum + c.totalScreens, 0),
    totalSeats: cinemas.reduce((sum, c) => sum + c.totalSeats, 0),
    cities: [...new Set(cinemas.map(c => c.city).filter(Boolean))].length
  };

  return (
      <div className="admin-stack">
        <div className="page-heading">
          <div>
            <p className="admin-eyebrow">Quản lý hệ thống</p>
            <h2>Quản lý rạp chiếu</h2>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Thêm rạp mới
          </button>
        </div>

        {/* Stats */}
        <section className="dashboard-kpi-grid">
          <article className="dashboard-card kpi">
            <p>Tổng rạp</p>
            <strong>{stats.total}</strong>
            <span>Trên toàn hệ thống</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Tổng phòng chiếu</p>
            <strong>{stats.totalScreens}</strong>
            <span>Tất cả các rạp</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Tổng ghế</p>
            <strong>{stats.totalSeats.toLocaleString()}</strong>
            <span>Sức chứa tối đa</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Thành phố</p>
            <strong>{stats.cities}</strong>
            <span>Có chi nhánh</span>
          </article>
        </section>

        {/* Search */}
        <div className="admin-filters">
          <input
            type="search"
            placeholder="Tìm kiếm rạp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">Đang tải...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên rạp</th>
                  <th>Địa chỉ</th>
                  <th>Thành phố</th>
                  <th>Hotline</th>
                  <th>Phòng chiếu</th>
                  <th>Ghế</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCinemas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty">Chưa có rạp nào</td>
                  </tr>
                ) : (
                  filteredCinemas.map(cinema => (
                    <tr key={cinema.id}>
                      <td><strong>{cinema.name}</strong></td>
                      <td>{cinema.address || "-"}</td>
                      <td>{cinema.city || "-"}</td>
                      <td>{cinema.hotline || "-"}</td>
                      <td>{cinema.totalScreens}</td>
                      <td>{cinema.totalSeats.toLocaleString()}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-action-btn" onClick={() => openEditModal(cinema)} title="Sửa">✏️</button>
                          <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(cinema)} title="Xóa">🗑️</button>
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
                <h2>{editingCinema ? "Sửa rạp" : "Thêm rạp mới"}</h2>
                <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="admin-modal__body">
                {message.text && (
                  <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
                )}
                
                <div className="admin-form-group">
                  <label>Tên rạp *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="admin-form-group">
                  <label>Địa chỉ</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                
                <div className="admin-form-group">
                  <label>Thành phố</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                
                <div className="admin-form-group">
                  <label>Hotline</label>
                  <input type="text" value={formData.hotline} onChange={e => setFormData({...formData, hotline: e.target.value})} />
                </div>

                <div className="admin-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : (editingCinema ? "Cập nhật" : "Tạo rạp")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
