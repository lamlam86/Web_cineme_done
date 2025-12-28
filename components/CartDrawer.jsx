"use client";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart, getCartTotal, getCartCount, calculateItemTotal } = useCart();

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN") + "đ";
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    });
  };

  const renderCartItem = (item) => {
    if (item.type === 'ticket') {
      return (
        <div key={item.id} className="cart-item">
          <div className="cart-item__poster">
            {item.movie?.poster_url ? (
              <img src={item.movie.poster_url} alt={item.movie.title} />
            ) : (
              <div className="cart-item__no-poster">🎬</div>
            )}
          </div>
          
          <div className="cart-item__info">
            <h3 className="cart-item__title">{item.movie?.title || 'Phim'}</h3>
            <div className="cart-item__details">
              <p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {formatTime(item.showtime?.start_time)} - {formatDate(item.showtime?.start_time)}
              </p>
              <p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {item.showtime?.branch} - {item.showtime?.screen}
              </p>
              <p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 8h20"></path>
                </svg>
                Ghế: <strong>{item.seats?.join(", ") || ''}</strong>
              </p>
            </div>
            
            {Object.keys(item.concessions || {}).length > 0 && (
              <div className="cart-item__concessions">
                <p>🍿 Bắp nước:</p>
                <ul>
                  {Object.entries(item.concessions).map(([id, qty]) => {
                    if (qty === 0) return null;
                    const concession = item.concessionItems?.find(c => c.id === Number(id));
                    return concession ? (
                      <li key={id}>{concession.name} x{qty}</li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
            
            <div className="cart-item__footer">
              <span className="cart-item__total">{formatPrice(calculateItemTotal(item))}</span>
              <button 
                className="cart-item__remove"
                onClick={() => removeFromCart(item.id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      );
    } else if (item.type === 'concession') {
      return (
        <div key={item.id} className="cart-item">
          <div className="cart-item__poster">
            <div className="cart-item__no-poster">🍿</div>
          </div>
          
          <div className="cart-item__info">
            <h3 className="cart-item__title">Bắp & Nước</h3>
            <div className="cart-item__details">
              {item.branch && (
                <p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {item.branch.name} ({item.branch.city})
                </p>
              )}
              <div className="cart-item__concessions">
                <p>🍿 Sản phẩm:</p>
                <ul>
                  {item.items?.map((product, idx) => (
                    <li key={idx}>{product.name} x{product.quantity}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="cart-item__footer">
              <span className="cart-item__total">{formatPrice(calculateItemTotal(item))}</span>
              <button 
                className="cart-item__remove"
                onClick={() => removeFromCart(item.id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      );
    } else if (item.type === 'event' || item.type === 'service') {
      return (
        <div key={item.id} className="cart-item">
          <div className="cart-item__poster">
            <div className="cart-item__no-poster">{item.icon || (item.type === 'event' ? '🎬' : '🎮')}</div>
          </div>
          
          <div className="cart-item__info">
            <h3 className="cart-item__title">{item.title}</h3>
            <div className="cart-item__details">
              <p>{item.description}</p>
              {item.features && item.features.length > 0 && (
                <div className="cart-item__concessions">
                  <p>✨ Bao gồm:</p>
                  <ul>
                    {item.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="cart-item__footer">
              <span className="cart-item__total">{formatPrice(calculateItemTotal(item))}</span>
              <button 
                className="cart-item__remove"
                onClick={() => removeFromCart(item.id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      
      {/* Drawer */}
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Giỏ hàng ({getCartCount()} {getCartCount() === 1 ? 'món' : 'món'})
          </h2>
          <button className="cart-drawer__close" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </div>

        <div className="cart-drawer__body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty__icon">🎬</div>
              <p>Giỏ hàng trống</p>
              <Link href="/movie" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                Đặt vé ngay
              </Link>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map(item => renderCartItem(item))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-total">
              <span>Tổng cộng:</span>
              <strong>{formatPrice(getCartTotal())}</strong>
            </div>
            <Link 
              href="/checkout" 
              className="btn btn-primary cart-checkout-btn"
              onClick={() => setIsOpen(false)}
            >
              Thanh toán ({getCartCount()} vé)
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

