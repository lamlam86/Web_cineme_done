"use client";
import { useState, useEffect } from "react";

const SEAT_TYPES = {
  standard: "Ghế thường",
  vip: "Ghế VIP",
};

export default function AdminTicketPricesPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrice, setNewPrice] = useState({
    screen_type: "standard",
    seat_type: "standard",
    price: 65000,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ticket-prices?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPrices(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePrice(id) {
    try {
      await fetch("/api/admin/ticket-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price: parseInt(editPrice) }),
      });
      setEditingId(null);
      fetchPrices();
    } catch {}
  }

  async function handleToggleActive(id, currentActive) {
    try {
      await fetch("/api/admin/ticket-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      fetchPrices();
    } catch {}
  }

  async function handleAddPrice(e) {
    e.preventDefault();
    try {
      await fetch("/api/admin/ticket-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrice),
      });
      setShowAddModal(false);
      fetchPrices();
    } catch {}
  }

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <h2>Bảng giá vé</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Thêm giá vé
        </button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Loại ghế</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.id}>
                  <td>{SEAT_TYPES[price.seatType]}</td>
                  <td>
                    {editingId === price.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                      />
                    ) : (
                      <strong>{price.price.toLocaleString()}đ</strong>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleToggleActive(price.id, price.isActive)}>
                      {price.isActive ? "Đang áp dụng" : "Tạm dừng"}
                    </button>
                  </td>
                  <td>
                    {editingId === price.id ? (
                      <button onClick={() => handleUpdatePrice(price.id)}>Lưu</button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(price.id);
                          setEditPrice(price.price.toString());
                        }}
                      >
                        Sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddPrice}>
              <select
                value={newPrice.seat_type}
                onChange={(e) =>
                  setNewPrice({ ...newPrice, seat_type: e.target.value })
                }
              >
                {Object.entries(SEAT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newPrice.price}
                onChange={(e) =>
                  setNewPrice({ ...newPrice, price: parseInt(e.target.value) })
                }
              />
              <button type="submit">Thêm</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
