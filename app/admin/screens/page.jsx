"use client";
import { useState, useEffect } from "react";

const SCREEN_TYPES = {
  standard: "Phòng chiếu"
};

const STATUS_OPTIONS = {
  active: "Hoạt động",
  maintenance: "Bảo trì",
  inactive: "Ngừng hoạt động"
};

export default function AdminScreensPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "standard",
    seat_rows: 10,
    seat_cols: 12,
    status: "active"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchScreens(selectedBranch);
    }
  }, [selectedBranch]);

  async function fetchBranches() {
    try {
      const res = await fetch(`/api/admin/cinemas?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setBranches(data.data || []);
      if (data.data?.length > 0) {
        setSelectedBranch(data.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchScreens(branchId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/screens?branch_id=${branchId}&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setScreens(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingScreen(null);
    setFormData({
      name: `Rạp ${String(screens.length + 1).padStart(2, '0')}`,
      type: "standard",
      seat_rows: 10,
      seat_cols: 12,
      status: "active"
    });
    setShowModal(true);
  }

  function openEditModal(screen) {
    setEditingScreen(screen);
    setFormData({
      name: screen.name,
      type: screen.type,
      seat_rows: screen.seatRows,
      seat_cols: screen.seatCols,
      status: screen.status
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const url = editingScreen 
        ? `/api/admin/screens/${editingScreen.id}` 
        : "/api/admin/screens";
      const method = editingScreen ? "PATCH" : "POST";
      
      const payload = {
        ...formData,
        branch_id: parseInt(selectedBranch)
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error((await res.json()).error);
      
      setMessage({ type: "success", text: editingScreen ? "Cập nhật thành công!" : "Thêm phòng chiếu thành công!" });
      fetchScreens(selectedBranch);
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(screen) {
    if (!confirm(`Bạn có chắc muốn xóa ${screen.name}? Tất cả ghế và suất chiếu liên quan sẽ bị xóa.`)) return;

    try {
      const res = await fetch(`/api/admin/screens/${screen.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setScreens(prev => prev.filter(s => s.id !== screen.id));
      setMessage({ type: "success", text: "Đã xóa phòng chiếu!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
  }

  async function handleRegenerateSeats(screen) {
    if (!confirm(`Tạo lại ghế cho ${screen.name}? Ghế cũ sẽ bị xóa.`)) return;

    try {
      const res = await fetch(`/api/admin/screens/${screen.id}/seats`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setMessage({ type: "success", text: `Đã tạo ${data.data.count} ghế!` });
      fetchScreens(selectedBranch);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
  }

  const currentBranch = branches.find(b => b.id.toString() === selectedBranch);

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Quản lý hệ thống</p>
          <h2>Quản lý Phòng chiếu</h2>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} disabled={!selectedBranch}>
          + Thêm phòng chiếu
        </button>
      </div>

      {message.text && (
        <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
      )}

      {/* Branch Selector */}
      <div className="admin-filters" style={{ gap: 16 }}>
        <select
          className="admin-input"
          style={{ width: "auto", minWidth: 300 }}
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="">-- Chọn rạp --</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name} - {b.city}</option>
          ))}
        </select>
        {currentBranch && (
          <span style={{ color: "var(--text-muted)" }}>
            📍 {currentBranch.address}
          </span>
        )}
      </div>

      {/* Stats */}
      {selectedBranch && (
        <section className="dashboard-kpi-grid">
          <article className="dashboard-card kpi">
            <p>Tổng phòng</p>
            <strong>{screens.length}</strong>
            <span>Phòng chiếu</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Đang hoạt động</p>
            <strong>{screens.filter(s => s.status === "active").length}</strong>
            <span>Phòng</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Tổng ghế</p>
            <strong>{screens.reduce((sum, s) => sum + s.totalSeats, 0)}</strong>
            <span>Ghế ngồi</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Suất chiếu</p>
            <strong>{screens.reduce((sum, s) => sum + s.showtimeCount, 0)}</strong>
            <span>Đang có</span>
          </article>
        </section>
      )}

      {/* Screens Table */}
      {loading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : !selectedBranch ? (
        <div className="admin-empty-state">
          <p>Vui lòng chọn rạp để xem danh sách phòng chiếu</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên phòng</th>
                <th>Kích thước</th>
                <th>Số ghế</th>
                <th>Suất chiếu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {screens.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">Chưa có phòng chiếu nào</td></tr>
              ) : (
                screens.map(screen => (
                  <tr key={screen.id}>
                    <td><strong>{screen.name}</strong></td>
                    <td>{screen.seatRows} hàng × {screen.seatCols} cột</td>
                    <td>
                      <strong>{screen.totalSeats}</strong>
                      {screen.totalSeats !== screen.seatRows * screen.seatCols && (
                        <span style={{ color: "var(--warning)", marginLeft: 8 }}>
                          ⚠️ Cần tạo lại ghế
                        </span>
                      )}
                    </td>
                    <td>{screen.showtimeCount}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${screen.status === 'active' ? 'success' : screen.status === 'maintenance' ? 'warning' : 'danger'}`}>
                        {STATUS_OPTIONS[screen.status] || screen.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ flexDirection: 'row', gap: '8px' }}>
                        <button
                          className="admin-action-btn"
                          onClick={() => openEditModal(screen)}
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-action-btn"
                          onClick={() => handleRegenerateSeats(screen)}
                          title="Tạo lại ghế"
                        >
                          🪑
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          onClick={() => handleDelete(screen)}
                          title="Xóa"
                          disabled={screen.showtimeCount > 0}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="admin-modal__header">
              <h2>{editingScreen ? "Chỉnh sửa phòng chiếu" : "Thêm phòng chiếu mới"}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal__body">
              {message.text && (
                <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
              )}

              <div className="admin-form-group">
                <label>Tên phòng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Rạp 01, Rạp 02..."
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Số hàng ghế *</label>
                  <input
                    type="number"
                    value={formData.seat_rows}
                    onChange={e => setFormData({ ...formData, seat_rows: parseInt(e.target.value) })}
                    min={1}
                    max={26}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Số cột ghế *</label>
                  <input
                    type="number"
                    value={formData.seat_cols}
                    onChange={e => setFormData({ ...formData, seat_cols: parseInt(e.target.value) })}
                    min={1}
                    max={30}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Tổng số ghế</label>
                <input
                  type="text"
                  value={`${formData.seat_rows * formData.seat_cols} ghế`}
                  disabled
                  style={{ background: "var(--bg-muted)" }}
                />
              </div>

              <div className="admin-form-group">
                <label>Trạng thái *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  {Object.entries(STATUS_OPTIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : (editingScreen ? "Cập nhật" : "Thêm phòng")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
