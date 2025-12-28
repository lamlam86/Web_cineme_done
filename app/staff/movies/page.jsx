'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY_FORM = {
  title: '',
  poster: '',
  backdrop: '',
  trailer: '',
  synopsis: '',
  genres: '',
  language: 'Tiếng Việt',
  country: 'Việt Nam',
  director: '',
  cast: '',
  status: 'now_showing',
  releaseDate: '',
  duration: 120,
  rating: 'P',
};

const STATUS_LABELS = {
  now_showing: 'Đang chiếu',
  coming_soon: 'Sắp chiếu',
  draft: 'Nháp',
};

export default function StaffMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [flash, setFlash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Fetch failed');
      const payload = await res.json();
      setMovies(payload.data ?? []);
    } catch (error) {
      console.error(error);
      setFlash({ type: 'error', message: 'Không thể tải danh sách phim.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const filteredMovies = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return movies.filter(movie => {
      const matchFilter = filter === 'all' ? true : movie.status === filter;
      const matchKeyword = movie.title.toLowerCase().includes(keyword);
      return matchFilter && matchKeyword;
    });
  }, [filter, movies, search]);

  const stats = useMemo(() => {
    const nowShowing = movies.filter(m => m.status === 'now_showing').length;
    const coming = movies.filter(m => m.status === 'coming_soon').length;
    const draft = movies.filter(m => m.status === 'draft').length;
    return { total: movies.length, nowShowing, coming, draft };
  }, [movies]);

  const resetFlash = (message) => {
    setFlash(message);
    if (message) setTimeout(() => setFlash(null), 2400);
  };

  const openCreateModal = () => {
    setEditingMovie(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title,
      poster: movie.poster || '',
      backdrop: movie.backdrop || '',
      trailer: movie.trailer || '',
      synopsis: movie.synopsis || '',
      genres: movie.genres || '',
      language: movie.language || 'Tiếng Việt',
      country: movie.country || 'Việt Nam',
      director: movie.director || '',
      cast: movie.cast || '',
      status: movie.status,
      releaseDate: movie.releaseDate || '',
      duration: movie.duration || 120,
      rating: movie.rating || 'P',
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const errors = [];
    if (!form.title.trim()) errors.push('Tiêu đề');
    if (!form.poster.trim()) errors.push('Poster URL');
    if (!form.genres.trim()) errors.push('Thể loại');
    if (!form.synopsis.trim()) errors.push('Mô tả');
    if (!form.duration || form.duration < 1) errors.push('Thời lượng');
    if (!form.releaseDate) errors.push('Ngày phát hành');
    
    if (errors.length > 0) {
      resetFlash({ type: 'error', message: `Vui lòng điền: ${errors.join(', ')}` });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingMovie ? `/api/movies/${editingMovie.id}` : '/api/movies';
      const method = editingMovie ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          status: form.status,
          poster: form.poster || null,
          backdrop: form.backdrop || null,
          trailer: form.trailer || null,
          synopsis: form.synopsis || null,
          genres: form.genres || null,
          language: form.language || null,
          country: form.country || null,
          director: form.director || null,
          cast: form.cast || null,
          releaseDate: form.releaseDate || null,
          duration: form.duration,
          rating: form.rating,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }
      resetFlash({ type: 'success', message: editingMovie ? 'Cập nhật thành công!' : 'Đã thêm phim!' });
      fetchMovies();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      resetFlash({ type: 'error', message: error.message || 'Không thể lưu phim.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (movieId, nextStatus) => {
    try {
      const res = await fetch(`/api/movies/${movieId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      fetchMovies();
    } catch (error) {
      resetFlash({ type: 'error', message: 'Không thể cập nhật trạng thái.' });
    }
  };

  const handleDelete = async (movieId) => {
    if (!confirm('Bạn chắc chắn muốn xóa phim này?')) return;
    try {
      const res = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMovies(prev => prev.filter(m => m.id !== movieId));
      resetFlash({ type: 'success', message: 'Đã xóa phim!' });
    } catch (error) {
      resetFlash({ type: 'error', message: 'Không thể xóa phim.' });
    }
  };

  const filterOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'now_showing', label: 'Đang chiếu' },
    { id: 'coming_soon', label: 'Sắp chiếu' },
    { id: 'draft', label: 'Nháp' },
  ];

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Quản lý nội dung</p>
          <h2>Quản lý phim</h2>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Thêm phim mới
        </button>
      </div>

      {flash && <div className={`admin-message admin-message--${flash.type}`}>{flash.message}</div>}

      <div className="admin-toolbar">
        <div className="admin-filters">
          {filterOptions.map(option => (
            <button
              key={option.id}
              type="button"
              className={`admin-filter-btn ${filter === option.id ? 'admin-filter-btn--active' : ''}`}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
              {option.id === 'all' && <span className="admin-filter-count">{stats.total}</span>}
              {option.id === 'now_showing' && <span className="admin-filter-count">{stats.nowShowing}</span>}
              {option.id === 'coming_soon' && <span className="admin-filter-count">{stats.coming}</span>}
              {option.id === 'draft' && <span className="admin-filter-count">{stats.draft}</span>}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Tìm phim..."
          value={search}
          onChange={e => setSearch(e.target.value)}
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
                <th>Phim</th>
                <th>Trạng thái</th>
                <th>Ngày phát hành</th>
                <th>Suất chiếu</th>
                <th>Vé bán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">Không có phim nào</td>
                </tr>
              ) : (
                filteredMovies.map(movie => (
                  <tr key={movie.id}>
                    <td>
                      <div className="admin-user-cell">
                        {movie.poster && (
                          <img src={movie.poster} alt="" style={{width: 40, height: 56, borderRadius: 4, objectFit: 'cover'}} />
                        )}
                        <div>
                          <strong>{movie.title}</strong>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                            {movie.duration} phút • {movie.rating || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="admin-input admin-input--dense"
                        value={movie.status}
                        onChange={e => handleStatusChange(movie.id, e.target.value)}
                      >
                        <option value="now_showing">Đang chiếu</option>
                        <option value="coming_soon">Sắp chiếu</option>
                        <option value="draft">Nháp</option>
                      </select>
                    </td>
                    <td>{movie.releaseDate || '-'}</td>
                    <td>{movie.totalShows}</td>
                    <td>{movie.soldTickets?.toLocaleString() || 0}</td>
                    <td>
                      <div className="admin-actions" style={{flexDirection: 'row', gap: '8px'}}>
                        <button className="admin-action-btn" onClick={() => openEditModal(movie)} title="Sửa">
                          ✏️
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(movie.id)} title="Xóa">
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

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editingMovie ? 'Sửa phim' : 'Thêm phim mới'}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-modal__body admin-movie-form">
              <div className="admin-form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Nhập tên phim"
                  required
                />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="now_showing">Đang chiếu</option>
                    <option value="coming_soon">Sắp chiếu</option>
                    <option value="draft">Nháp</option>
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label>Ngày phát hành *</label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={e => setForm({...form, releaseDate: e.target.value})}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Thời lượng (phút) *</label>
                  <input
                    type="number"
                    min={40}
                    max={240}
                    value={form.duration}
                    onChange={e => setForm({...form, duration: Number(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Độ tuổi</label>
                  <select value={form.rating} onChange={e => setForm({...form, rating: e.target.value})}>
                    <option value="P">P - Phổ biến</option>
                    <option value="T13">T13 - Trên 13 tuổi</option>
                    <option value="T16">T16 - Trên 16 tuổi</option>
                    <option value="T18">T18 - Trên 18 tuổi</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Thể loại *</label>
                  <input
                    type="text"
                    value={form.genres}
                    onChange={e => setForm({...form, genres: e.target.value})}
                    placeholder="Hành động, Phiêu lưu, ..."
                    required
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Ngôn ngữ</label>
                  <input
                    type="text"
                    value={form.language}
                    onChange={e => setForm({...form, language: e.target.value})}
                    placeholder="Tiếng Việt"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Quốc gia</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={e => setForm({...form, country: e.target.value})}
                    placeholder="Việt Nam, Mỹ, ..."
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Đạo diễn</label>
                <input
                  type="text"
                  value={form.director}
                  onChange={e => setForm({...form, director: e.target.value})}
                  placeholder="Tên đạo diễn"
                />
              </div>

              <div className="admin-form-group">
                <label>Diễn viên</label>
                <input
                  type="text"
                  value={form.cast}
                  onChange={e => setForm({...form, cast: e.target.value})}
                  placeholder="Diễn viên 1, Diễn viên 2, ..."
                />
              </div>

              <div className="admin-form-group">
                <label>Mô tả *</label>
                <textarea
                  value={form.synopsis}
                  onChange={e => setForm({...form, synopsis: e.target.value})}
                  placeholder="Nội dung phim..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label>Poster (URL) *</label>
                <input
                  type="url"
                  value={form.poster}
                  onChange={e => setForm({...form, poster: e.target.value})}
                  placeholder="https://image.tmdb.org/..."
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Backdrop (URL)</label>
                <input
                  type="text"
                  value={form.backdrop}
                  onChange={e => setForm({...form, backdrop: e.target.value})}
                  placeholder="https://image.tmdb.org/..."
                />
              </div>

              <div className="admin-form-group">
                <label>🎬 Link Trailer (YouTube)</label>
                <input
                  type="text"
                  value={form.trailer}
                  onChange={e => setForm({...form, trailer: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (editingMovie ? 'Cập nhật' : 'Thêm phim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

