"use client";
import { useState, useEffect } from "react";

const PAYMENT_STATUS = {
  pending: { label: "Chờ thanh toán", color: "orange" },
  paid: { label: "Đã thanh toán", color: "green" },
  failed: { label: "Thất bại", color: "red" },
  refunded: { label: "Hoàn tiền", color: "blue" }
};

const BOOKING_STATUS = {
  reserved: { label: "Đã đặt", color: "blue" },
  pending_confirmation: { label: "Chờ xác nhận CK", color: "orange" },
  confirmed: { label: "Đã xác nhận", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" }
};

const PAYMENT_METHODS = {
  momo: "Ví MoMo",
  vnpay: "VNPay",
  bank: "Chuyển khoản",
  cash: "Tiền mặt"
};

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchOrders();
  }, [filter, pagination.page]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}&page=${pagination.page}&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setOrders(data.data || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, field, value) {
    try {
      // Nếu cập nhật payment_status, tự động cập nhật status đơn hàng tương ứng
      let updateData = { [field]: value };
      
      if (field === "payment_status") {
        if (value === "paid") {
          // Đã thanh toán -> Đã xác nhận
          updateData.status = "confirmed";
        } else if (value === "pending") {
          // Chờ thanh toán -> Đã đặt
          updateData.status = "reserved";
        }
      }
      
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  }

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === "paid").length,
    pending: orders.filter(o => o.payment_status === "pending").length,
    revenue: orders.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + o.total_amount, 0)
  };

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Vận hành</p>
          <h2>Quản lý Đơn hàng / Vé</h2>
        </div>
      </div>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-card kpi">
          <p>Tổng đơn</p>
          <strong>{pagination.total}</strong>
          <span>Trong hệ thống</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Đã thanh toán</p>
          <strong>{stats.paid}</strong>
          <span>Trang hiện tại</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Chờ xử lý</p>
          <strong>{stats.pending}</strong>
          <span>Cần thanh toán</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Doanh thu</p>
          <strong>{stats.revenue.toLocaleString()}đ</strong>
          <span>Trang hiện tại</span>
        </article>
      </section>

      <div className="admin-filters">
        {["all", "pending", "paid", "failed", "refunded"].map(s => (
          <button
            key={s}
            className={`admin-filter-btn ${filter === s ? "admin-filter-btn--active" : ""}`}
            onClick={() => { setFilter(s); setPagination(p => ({...p, page: 1})); }}
          >
            {s === "all" ? "Tất cả" : PAYMENT_STATUS[s]?.label}
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
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phim / Suất chiếu</th>
                <th>Ghế</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="8" className="admin-empty">Chưa có đơn hàng nào</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{cursor: "pointer"}}>
                    <td><code>{order.booking_code}</code></td>
                    <td>
                      {order.user ? (
                        <div>
                          <strong>{order.user.name}</strong>
                          <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>{order.user.email}</div>
                        </div>
                      ) : <span style={{color: "var(--text-muted)"}}>Khách vãng lai</span>}
                    </td>
                    <td>
                      <div>
                        <strong>{order.movie}</strong>
                        <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>
                          {order.branch} • {order.screen}
                        </div>
                        <div style={{fontSize: "0.8rem", color: "var(--text-soft)"}}>
                          {new Date(order.showtime).toLocaleString("vi-VN")}
                        </div>
                      </div>
                    </td>
                    <td>{order.seats.join(", ")}</td>
                    <td><strong>{order.total_amount.toLocaleString()}đ</strong></td>
                    <td>
                      <select
                        className="admin-input admin-input--dense"
                        value={order.payment_status}
                        onChange={e => { e.stopPropagation(); updateStatus(order.id, "payment_status", e.target.value); }}
                        onClick={e => e.stopPropagation()}
                      >
                        {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${order.status}`}>
                        {BOOKING_STATUS[order.status]?.label}
                      </span>
                    </td>
                    <td style={{fontSize: "0.85rem"}}>{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>← Trước</button>
          <span>Trang {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>Sau →</button>
        </div>
      )}

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedOrder(null); setEditMode(false); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 650}}>
            <div className="admin-modal__header">
              <h2>{editMode ? "Chỉnh sửa" : "Chi tiết"} đơn hàng #{selectedOrder.booking_code}</h2>
              <button className="admin-modal__close" onClick={() => { setSelectedOrder(null); setEditMode(false); }}>×</button>
            </div>
            <div className="admin-modal__body">
              {message.text && (
                <div className={`admin-message admin-message--${message.type}`} style={{marginBottom: 16}}>
                  {message.text}
                </div>
              )}

              <div style={{display: "grid", gap: 16}}>
                <div style={{display: "flex", gap: 16, alignItems: "center"}}>
                  {selectedOrder.movie_poster && (
                    <img src={selectedOrder.movie_poster} alt="" style={{width: 80, borderRadius: 8}} />
                  )}
                  <div>
                    <h3 style={{margin: 0}}>{selectedOrder.movie}</h3>
                    <p style={{margin: "4px 0", color: "var(--text-muted)"}}>{selectedOrder.branch} • {selectedOrder.screen}</p>
                    <p style={{margin: 0, color: "var(--text-soft)"}}>{new Date(selectedOrder.showtime).toLocaleString("vi-VN")}</p>
                  </div>
                </div>

                <div style={{background: "var(--glass)", padding: 16, borderRadius: 8}}>
                  <h4 style={{margin: "0 0 8px", color: "var(--text-soft)"}}>Khách hàng</h4>
                  {selectedOrder.user ? (
                    <div>
                      <p style={{margin: "4px 0"}}><strong>{selectedOrder.user.name}</strong></p>
                      <p style={{margin: "4px 0", fontSize: "0.9rem"}}>{selectedOrder.user.email}</p>
                      {selectedOrder.user.phone && <p style={{margin: "4px 0", fontSize: "0.9rem"}}>{selectedOrder.user.phone}</p>}
                    </div>
                  ) : (
                    <p style={{margin: 0, color: "var(--text-muted)"}}>Khách vãng lai</p>
                  )}
                </div>
                
                <div style={{background: "var(--glass)", padding: 16, borderRadius: 8}}>
                  <h4 style={{margin: "0 0 8px", color: "var(--text-soft)"}}>Chi tiết vé</h4>
                  <p style={{margin: "0 0 8px"}}><strong>Ghế:</strong> {selectedOrder.seats.join(", ")}</p>
                  {selectedOrder.concessions && selectedOrder.concessions.length > 0 && (
                    <div>
                      <p style={{margin: "8px 0 4px"}}><strong>Combo:</strong></p>
                      {selectedOrder.concessions.map((c, i) => (
                        <p key={i} style={{margin: 0, fontSize: "0.9rem", color: "var(--text-muted)"}}>
                          • {c.name} x{c.quantity} - {c.price?.toLocaleString()}đ
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div style={{display: "grid", gap: 12}}>
                    <div className="admin-form-group">
                      <label>Trạng thái đơn hàng</label>
                      <select
                        className="admin-input"
                        value={editForm.status || selectedOrder.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value})}
                      >
                        {Object.entries(BOOKING_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Trạng thái thanh toán</label>
                      <select
                        className="admin-input"
                        value={editForm.payment_status || selectedOrder.payment_status}
                        onChange={e => setEditForm({...editForm, payment_status: e.target.value})}
                      >
                        {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Phương thức thanh toán</label>
                      <select
                        className="admin-input"
                        value={editForm.payment_method || selectedOrder.payment_method || "momo"}
                        onChange={e => setEditForm({...editForm, payment_method: e.target.value})}
                      >
                        {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                    <div>
                      <span style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>Trạng thái</span>
                      <p style={{margin: "4px 0"}}>
                        <span className={`admin-badge admin-badge--${selectedOrder.status}`}>
                          {BOOKING_STATUS[selectedOrder.status]?.label}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>Thanh toán</span>
                      <p style={{margin: "4px 0"}}>
                        <span className={`admin-badge admin-badge--${selectedOrder.payment_status}`}>
                          {PAYMENT_STATUS[selectedOrder.payment_status]?.label}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>Phương thức</span>
                      <p style={{margin: "4px 0"}}>{PAYMENT_METHODS[selectedOrder.payment_method] || "Chưa xác định"}</p>
                    </div>
                    <div>
                      <span style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>Ngày đặt</span>
                      <p style={{margin: "4px 0"}}>{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                )}
                
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 16}}>
                  <span style={{fontSize: "1.1rem"}}>Tổng cộng</span>
                  <strong style={{fontSize: "1.4rem", color: "var(--primary-light)"}}>{selectedOrder.total_amount.toLocaleString()}đ</strong>
                </div>
              </div>
            </div>

            <div className="admin-modal__footer" style={{display: "flex", gap: 12, justifyContent: "space-between"}}>
              {editMode ? (
                <>
                  <button className="btn btn-secondary" onClick={() => { setEditMode(false); setEditForm({}); setMessage({ type: "", text: "" }); }}>Hủy</button>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(editForm)
                        });
                        setMessage({ type: "success", text: "Cập nhật thành công!" });
                        fetchOrders();
                        setTimeout(() => { setSelectedOrder(null); setEditMode(false); }, 1000);
                      } catch (e) {
                        setMessage({ type: "error", text: e.message });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Đóng</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditMode(true);
                      setEditForm({
                        status: selectedOrder.status,
                        payment_status: selectedOrder.payment_status,
                        payment_method: selectedOrder.payment_method
                      });
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

