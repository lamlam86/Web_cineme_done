"use client";
import { useState, useEffect } from "react";

const STATUS_LABELS = {
  scheduled: "Đã lên lịch",
  selling: "Đang bán",
  closed: "Đóng",
  cancelled: "Đã hủy"
};

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ movie_id: "", branch_id: "", date: new Date().toISOString().split("T")[0] });
  const [showModal, setShowModal] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [formData, setFormData] = useState({
    movie_id: "", screen_id: "", start_time: "", language: "Tiếng Việt", subtitle: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchShowtimes();
  }, [filters]);

  async function fetchData() {
    try {
      const [moviesRes, branchesRes] = await Promise.all([
        fetch("/api/movies"),
        fetch("/api/admin/cinemas")
      ]);
      const moviesData = await moviesRes.json();
      const branchesData = await branchesRes.json();
      setMovies(moviesData.data || []);
      setBranches(branchesData.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchShowtimes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.movie_id) params.append("movie_id", filters.movie_id);
      if (filters.branch_id) params.append("branch_id", filters.branch_id);
      if (filters.date) params.append("date", filters.date);
      params.append("_t", Date.now()); // Cache bust
      
      const res = await fetch(`/api/admin/showtimes?${params}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      console.log("Fetched showtimes:", data.data?.length);
      setShowtimes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchScreens(branchId) {
    const branch = branches.find(b => b.id === parseInt(branchId));
    setScreens(branch?.screens || []);
  }

  function openCreateModal() {
    setEditingShowtime(null);
    setFormData({ movie_id: "", screen_id: "", start_time: "", language: "Tiếng Việt", subtitle: "" });
    setShowModal(true);
  }

  async function openEditModal(showtime) {
    setEditingShowtime(showtime);
    const branch = branches.find(b => b.id === showtime.branch.id);
    setScreens(branch?.screens || []);
    const startTime = new Date(showtime.start_time);
    const localTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData({
      movie_id: showtime.movie.id.toString(),
      screen_id: showtime.screen.id.toString(),
      start_time: localTime,
      language: showtime.language || "Tiếng Việt",
      subtitle: showtime.subtitle || ""
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const url = editingShowtime ? `/api/admin/showtimes/${editingShowtime.id}` : "/api/admin/showtimes";
      const method = editingShowtime ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage({ type: "success", text: editingShowtime ? "Cập nhật thành công!" : "Tạo suất chiếu thành công!" });
      fetchShowtimes();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(showtime) {
    if (!confirm(`Bạn có chắc muốn xóa suất chiếu ${showtime.movie.title} lúc ${new Date(showtime.start_time).toLocaleTimeString("vi-VN")}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/showtimes/${showtime.id}`, { 
        method: "DELETE",
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Remove from local state immediately
      setShowtimes(prev => prev.filter(s => s.id !== showtime.id));
      alert("Đã xóa suất chiếu thành công!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateStatus(showtime, newStatus) {
    try {
      const res = await fetch(`/api/admin/showtimes/${showtime.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchShowtimes();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
      <div className="admin-stack">
        <div className="page-heading">
          <div>
            <p className="admin-eyebrow">Quản lý nội dung</p>
            <h2>Quản lý Lịch chiếu</h2>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Thêm suất chiếu
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters" style={{gap: 16}}>
          <input
            type="date"
            className="admin-input"
            style={{width: "auto"}}
            value={filters.date}
            onChange={e => setFilters({...filters, date: e.target.value})}
          />
          <select
            className="admin-input"
            style={{width: "auto", minWidth: 200}}
            value={filters.movie_id}
            onChange={e => setFilters({...filters, movie_id: e.target.value})}
          >
            <option value="">-- Tất cả phim --</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <select
            className="admin-input"
            style={{width: "auto", minWidth: 200}}
            value={filters.branch_id}
            onChange={e => setFilters({...filters, branch_id: e.target.value})}
          >
            <option value="">-- Tất cả rạp --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Stats */}
        <section className="dashboard-kpi-grid">
          <article className="dashboard-card kpi">
            <p>Suất chiếu</p>
            <strong>{showtimes.length}</strong>
            <span>Theo bộ lọc</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Đang bán</p>
            <strong>{showtimes.filter(s => s.status === "selling").length}</strong>
            <span>Có thể đặt vé</span>
          </article>
          <article className="dashboard-card kpi">
            <p>Tổng đặt</p>
            <strong>{showtimes.reduce((sum, s) => sum + s.bookings_count, 0)}</strong>
            <span>Lượt đặt vé</span>
          </article>
        </section>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">Đang tải...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Rạp / Phòng</th>
                  <th>Thời gian</th>
                  <th>Ngôn ngữ</th>
                  <th>Đặt vé</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.length === 0 ? (
                  <tr><td colSpan="7" className="admin-empty">Không có suất chiếu nào</td></tr>
                ) : (
                  showtimes.map(showtime => (
                    <tr key={showtime.id}>
                      <td>
                        <div className="admin-user-cell">
                          {showtime.movie.poster_url && (
                            <img src={showtime.movie.poster_url} alt="" style={{width: 40, height: 56, borderRadius: 4, objectFit: "cover"}} />
                          )}
                          <div>
                            <strong>{showtime.movie.title}</strong>
                            <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>{showtime.movie.duration} phút</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{showtime.branch.name}</strong>
                          <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>{showtime.screen.name} ({showtime.screen.type})</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{new Date(showtime.start_time).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}</strong>
                          <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>
                            {new Date(showtime.start_time).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span>{showtime.language || "-"}</span>
                          {showtime.subtitle && <div style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>Sub: {showtime.subtitle}</div>}
                        </div>
                      </td>
                      <td>{showtime.bookings_count}</td>
                      <td>
                        <select
                          className="admin-input admin-input--dense"
                          value={showtime.status}
                          onChange={e => updateStatus(showtime, e.target.value)}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="admin-actions" style={{flexDirection: 'row', gap: '8px'}}>
                          <button
                            className="admin-action-btn"
                            onClick={() => openEditModal(showtime)}
                            title="Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            onClick={() => handleDelete(showtime)}
                            title="Xóa"
                            disabled={showtime.bookings_count > 0}
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
            <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 500}}>
              <div className="admin-modal__header">
                <h2>{editingShowtime ? "Chỉnh sửa suất chiếu" : "Thêm suất chiếu mới"}</h2>
                <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="admin-modal__body">
                {message.text && (
                  <div className={`admin-message admin-message--${message.type}`}>{message.text}</div>
                )}
                
                <div className="admin-form-group">
                  <label>Phim *</label>
                  <select value={formData.movie_id} onChange={e => setFormData({...formData, movie_id: e.target.value})} required>
                    <option value="">-- Chọn phim --</option>
                    {movies.filter(m => m.status === "now_showing").map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label>Rạp *</label>
                  <select onChange={e => fetchScreens(e.target.value)} required>
                    <option value="">-- Chọn rạp --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label>Phòng chiếu *</label>
                  <select value={formData.screen_id} onChange={e => setFormData({...formData, screen_id: e.target.value})} required>
                    <option value="">-- Chọn phòng --</option>
                    {screens.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
                
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                  <div className="admin-form-group">
                    <label>Ngôn ngữ</label>
                    <input type="text" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
                  </div>
                  <div className="admin-form-group">
                    <label>Phụ đề</label>
                    <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                  </div>
                </div>

                <div className="admin-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : (editingShowtime ? "Cập nhật" : "Tạo suất chiếu")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
