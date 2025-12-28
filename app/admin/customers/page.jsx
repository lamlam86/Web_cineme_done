"use client";
import { useState, useEffect } from "react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=customer&page=${pagination.page}&search=${search}&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setCustomers(data.users || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(customer) {
    const newStatus = customer.status === "active" ? "blocked" : "active";
    try {
      await fetch(`/api/admin/users/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  }

  const stats = {
    total: pagination.total,
    active: customers.filter(c => c.status === "active").length,
    totalPoints: customers.reduce((sum, c) => sum + (c.points || 0), 0)
  };

  return (
      <div className="admin-stack">
        <div className="page-heading">
          <div>
            <p className="admin-eyebrow">Vận hành</p>
            <h2>Quản lý Khách hàng</h2>
          </div>
        </div>

        {/* Stats */}
        <section className="dashboard-kpi-grid">
          <article className="dashboard-card kpi">
            <p>Tổng khách hàng</p>
            <strong>{stats.total}</strong>
            <span>Đã đăng ký</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Đang hoạt động</p>
            <strong>{stats.active}</strong>
            <span>Trang hiện tại</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Tổng điểm</p>
            <strong>{stats.totalPoints.toLocaleString()}</strong>
            <span>Điểm tích lũy</span>
          </article>
        </section>

        {/* Search */}
        <div className="admin-filters">
          <input
            type="search"
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({...p, page: 1})); }}
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
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="7" className="admin-empty">Chưa có khách hàng nào</td></tr>
                ) : (
                  customers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt="" />
                            ) : (
                              customer.full_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{customer.full_name}</span>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || "-"}</td>
                      <td><strong>{(customer.points || 0).toLocaleString()}</strong></td>
                      <td>
                        <span className={`admin-badge admin-badge--${customer.status}`}>
                          {customer.status === "active" ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td>{new Date(customer.created_at).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => toggleStatus(customer)}
                            title={customer.status === "active" ? "Khóa" : "Mở khóa"}
                          >
                            {customer.status === "active" ? "🔒" : "🔓"}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>← Trước</button>
            <span>Trang {pagination.page} / {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>Sau →</button>
          </div>
        )}
      </div>
  );
}
