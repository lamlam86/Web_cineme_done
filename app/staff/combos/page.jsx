"use client";
import { useState, useEffect } from "react";

const TYPE_LABELS = {
  combo: "Combo",
  popcorn: "Bắp",
  drink: "Nước",
  snack: "Snack"
};

export default function StaffCombosPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "combo",
    image_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCombos();
  }, []);

  async function fetchCombos() {
    try {
      const res = await fetch(`/api/admin/combos?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setCombos(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCombo(null);
    setFormData({ name: "", description: "", price: "", type: "combo", image_url: "" });
    setShowModal(true);
  }

  function openEditModal(combo) {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      price: combo.price,
      type: combo.type,
      image_url: combo.image_url || ""
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = { ...formData, price: Number(formData.price) };
      
      if (editingCombo) {
        const res = await fetch(`/api/admin/combos/${editingCombo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Cập nhật thành công!" });
      } else {
        const res = await fetch("/api/admin/combos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Tạo combo thành công!" });
      }
      
      fetchCombos();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(combo) {
    if (!confirm(`Bạn có chắc muốn xóa "${combo.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/combos/${combo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchCombos();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredCombos = combos.filter(c => filter === "all" || c.type === filter);

  const stats = {
    total: combos.length,
    combos: combos.filter(c => c.type === "combo").length,
    popcorn: combos.filter(c => c.type === "popcorn").length,
    drinks: combos.filter(c => c.type === "drink").length,
    totalSold: combos.reduce((sum, c) => sum + c.totalSold, 0)
  };

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Gói ưu đãi</p>
          <h2>Quản lý Combo bắp nước</h2>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Thêm combo mới
        </button>
      </div>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-card kpi">
          <p>Tổng sản phẩm</p>
          <strong>{stats.total}</strong>
          <span>Đang bán</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Combo</p>
          <strong>{stats.combos}</strong>
          <span>Gói tiết kiệm</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Bắp + Nước</p>
          <strong>{stats.popcorn + stats.drinks}</strong>
          <span>Sản phẩm lẻ</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Đã bán</p>
          <strong>{stats.totalSold.toLocaleString()}</strong>
          <span>Tổng số lượng</span>
        </article>
      </section>

      <div className="admin-filters">
        {["all", "combo", "popcorn", "drink", "snack"].map(t => (
          <button
            key={t}
            className={`admin-filter-btn ${filter === t ? "admin-filter-btn--active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {t === "all" ? "Tất cả" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Đã bán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCombos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty">Chưa có sản phẩm nào</td>
                </tr>
              ) : (
                filteredCombos.map(combo => (
                  <tr key={combo.id}>
                    <td>
                      <div className="admin-user-cell">
                        {combo.image_url && (
                          <img src={combo.image_url} alt="" style={{width: 48, height: 48, borderRadius: 8, objectFit: "cover"}} />
                        )}
                        <div>
                          <strong>{combo.name}</strong>
                          {combo.description && <p style={{margin: 0, fontSize: "0.8rem", color: "var(--text-muted)"}}>{combo.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${combo.type}`}>
                        {TYPE_LABELS[combo.type]}
                      </span>
                    </td>
                    <td><strong>{combo.price.toLocaleString()}đ</strong></td>
                    <td>{combo.totalSold.toLocaleString()}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" onClick={() => openEditModal(combo)} title="Sửa">✏️</button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(combo)} title="Xóa">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editingCombo ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-modal__body">
              {message.text && (
                <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
              )}
              
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="admin-form-group">
                <label>Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              
              <div className="admin-form-group">
                <label>Giá *</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required min={0} />
              </div>
              
              <div className="admin-form-group">
                <label>Loại</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="combo">Combo</option>
                  <option value="popcorn">Bắp</option>
                  <option value="drink">Nước</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              
              <div className="admin-form-group">
                <label>Hình ảnh (URL)</label>
                <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : (editingCombo ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

