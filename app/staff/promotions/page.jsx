"use client";
import { useState, useEffect } from "react";

const STATUS_LABELS = {
  draft: "Nháp",
  active: "Hoạt động",
  expired: "Hết hạn",
  disabled: "Vô hiệu"
};

export default function StaffPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: "",
    max_usage: "",
    min_order_value: "",
    start_date: "",
    end_date: "",
    status: "draft"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    try {
      const res = await fetch(`/api/admin/promotions?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setPromotions(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPromo(null);
    setFormData({
      name: "", code: "", description: "", discount_type: "percent",
      discount_value: "", max_usage: "", min_order_value: "",
      start_date: "", end_date: "", status: "draft"
    });
    setShowModal(true);
  }

  function openEditModal(promo) {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      code: promo.code || "",
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_usage: promo.max_usage || "",
      min_order_value: promo.min_order_value || "",
      start_date: promo.start_date ? promo.start_date.split("T")[0] : "",
      end_date: promo.end_date ? promo.end_date.split("T")[0] : "",
      status: promo.status
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        max_usage: formData.max_usage ? Number(formData.max_usage) : null,
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null
      };
      
      if (editingPromo) {
        const res = await fetch(`/api/admin/promotions/${editingPromo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Cập nhật thành công!" });
      } else {
        const res = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Tạo khuyến mãi thành công!" });
      }
      
      fetchPromotions();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(promo) {
    if (!confirm(`Bạn có chắc muốn xóa "${promo.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchPromotions();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleStatus(promo) {
    const newStatus = promo.status === "active" ? "disabled" : "active";
    try {
      await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchPromotions();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredPromos = promotions.filter(p => filter === "all" || p.status === filter);

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === "active").length,
    used: promotions.reduce((sum, p) => sum + p.usage_count, 0)
  };

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Gói ưu đãi</p>
          <h2>Quản lý Khuyến mãi</h2>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Thêm khuyến mãi
        </button>
      </div>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-card kpi">
          <p>Tổng khuyến mãi</p>
          <strong>{stats.total}</strong>
          <span>Đã tạo</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Đang hoạt động</p>
          <strong>{stats.active}</strong>
          <span>Có thể sử dụng</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Lượt sử dụng</p>
          <strong>{stats.used.toLocaleString()}</strong>
          <span>Tổng cộng</span>
        </article>
      </section>

      <div className="admin-filters">
        {["all", "active", "draft", "expired", "disabled"].map(s => (
          <button
            key={s}
            className={`admin-filter-btn ${filter === s ? "admin-filter-btn--active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
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
                <th>Khuyến mãi</th>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Sử dụng</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.length === 0 ? (
                <tr><td colSpan="7" className="admin-empty">Chưa có khuyến mãi nào</td></tr>
              ) : (
                filteredPromos.map(promo => (
                  <tr key={promo.id}>
                    <td>
                      <strong>{promo.name}</strong>
                      {promo.description && <p style={{margin: 0, fontSize: "0.8rem", color: "var(--text-muted)"}}>{promo.description}</p>}
                    </td>
                    <td>{promo.code ? <code>{promo.code}</code> : "-"}</td>
                    <td>
                      <strong>
                        {promo.discount_type === "percent" 
                          ? `${promo.discount_value}%` 
                          : `${promo.discount_value.toLocaleString()}đ`}
                      </strong>
                    </td>
                    <td>{promo.usage_count}/{promo.max_usage || "∞"}</td>
                    <td style={{fontSize: "0.85rem"}}>
                      {promo.start_date && <div>Từ: {new Date(promo.start_date).toLocaleDateString("vi-VN")}</div>}
                      {promo.end_date && <div>Đến: {new Date(promo.end_date).toLocaleDateString("vi-VN")}</div>}
                      {!promo.start_date && !promo.end_date && "-"}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${promo.status}`}>
                        {STATUS_LABELS[promo.status]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" onClick={() => toggleStatus(promo)} title={promo.status === "active" ? "Vô hiệu" : "Kích hoạt"}>
                          {promo.status === "active" ? "⏸️" : "▶️"}
                        </button>
                        <button className="admin-action-btn" onClick={() => openEditModal(promo)} title="Sửa">✏️</button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(promo)} title="Xóa">🗑️</button>
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
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 600}}>
            <div className="admin-modal__header">
              <h2>{editingPromo ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-modal__body">
              {message.text && (
                <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
              )}
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                <div className="admin-form-group">
                  <label>Tên khuyến mãi *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="admin-form-group">
                  <label>Mã code</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: SALE50" />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label>Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                <div className="admin-form-group">
                  <label>Loại giảm giá *</label>
                  <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label>Giá trị giảm *</label>
                  <input type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} required min={0} />
                </div>
              </div>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                <div className="admin-form-group">
                  <label>Giới hạn sử dụng</label>
                  <input type="number" value={formData.max_usage} onChange={e => setFormData({...formData, max_usage: e.target.value})} min={0} placeholder="Không giới hạn" />
                </div>
                
                <div className="admin-form-group">
                  <label>Đơn tối thiểu (đ)</label>
                  <input type="number" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} min={0} />
                </div>
              </div>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                <div className="admin-form-group">
                  <label>Ngày bắt đầu</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                
                <div className="admin-form-group">
                  <label>Ngày kết thúc</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label>Trạng thái</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="draft">Nháp</option>
                  <option value="active">Hoạt động</option>
                  <option value="disabled">Vô hiệu</option>
                </select>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : (editingPromo ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

