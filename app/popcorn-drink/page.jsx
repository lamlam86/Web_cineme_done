"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

export default function PopcornDrinkPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [concessions, setConcessions] = useState({});
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Check user login
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (e) {
        // Guest
      } finally {
        setUserLoading(false);
      }
    }
    checkUser();
  }, []);

  // Fetch branches and concessions
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch branches
        const branchRes = await fetch("/api/branches");
        const branchData = await branchRes.json();
        if (branchData.branches) {
          setBranches(branchData.branches);
          if (branchData.branches.length > 0) {
            setSelectedBranch(branchData.branches[0].id);
          }
        }

        // Fetch concessions
        const concessionRes = await fetch("/api/concessions");
        const concessionData = await concessionRes.json();
        if (concessionData.concessions) {
          setConcessions(concessionData.concessions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleQuantityChange = (id, delta) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const newQty = Math.max(0, Math.min(10, current + delta));
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + "VND";
  };

  // Calculate total
  const total = useMemo(() => {
    let sum = 0;
    const allItems = [
      ...(concessions.combo || []),
      ...(concessions.drink || []),
      ...(concessions.popcorn || []),
      ...(concessions.snack || []),
    ];
    
    Object.entries(quantities).forEach(([id, qty]) => {
      const item = allItems.find(c => c.id === Number(id));
      if (item) sum += item.price * qty;
    });
    
    return sum;
  }, [quantities, concessions]);

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  // Get fallback emoji for concession
  const getConcessionEmoji = (type) => {
    switch (type) {
      case 'drink': return "🥤";
      case 'popcorn': return "🍿";
      case 'combo': return "🍿";
      case 'snack': return "🌮";
      default: return "🍿";
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="popcorn-page">
          <div className="container">
            <div className="loading-state">Đang tải...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="popcorn-page">
        <div className="container">
          {/* Select Branch */}
          <section className="popcorn-section">
            <h2 className="popcorn-section-title">CHỌN RẠP GẦN BẠN</h2>
            <div className="branch-select-wrapper">
              <select
                className="branch-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.city})
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Combos */}
          {concessions.combo?.length > 0 && (
            <section className="popcorn-section">
              <h2 className="popcorn-section-title">COMBO 2 NGĂN</h2>
              <div className="popcorn-grid">
                {concessions.combo.map((item) => (
                  <div key={item.id} className="popcorn-card">
                    <div className="popcorn-card__image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <span className="popcorn-card__emoji">{getConcessionEmoji('combo')}</span>
                      )}
                    </div>
                    <div className="popcorn-card__info">
                      <h3 className="popcorn-card__name">{item.name}</h3>
                      <p className="popcorn-card__desc">{item.description}</p>
                      <p className="popcorn-card__price">{formatPrice(item.price)}</p>
                    </div>
                    <div className="popcorn-card__qty">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{quantities[item.id] || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Drinks */}
          {concessions.drink?.length > 0 && (
            <section className="popcorn-section">
              <h2 className="popcorn-section-title">NƯỚC NGỌT</h2>
              <div className="popcorn-grid popcorn-grid--drinks">
                {concessions.drink.map((item) => (
                  <div key={item.id} className="popcorn-card popcorn-card--drink">
                    <div className="popcorn-card__image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <span className="popcorn-card__emoji">{getConcessionEmoji('drink')}</span>
                      )}
                    </div>
                    <div className="popcorn-card__info">
                      <h3 className="popcorn-card__name">{item.name}</h3>
                      <p className="popcorn-card__price">{formatPrice(item.price)}</p>
                    </div>
                    <div className="popcorn-card__qty">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{quantities[item.id] || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popcorn */}
          {concessions.popcorn?.length > 0 && (
            <section className="popcorn-section">
              <h2 className="popcorn-section-title">BẮP RANG</h2>
              <div className="popcorn-grid">
                {concessions.popcorn.map((item) => (
                  <div key={item.id} className="popcorn-card">
                    <div className="popcorn-card__image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <span className="popcorn-card__emoji">{getConcessionEmoji('popcorn')}</span>
                      )}
                    </div>
                    <div className="popcorn-card__info">
                      <h3 className="popcorn-card__name">{item.name}</h3>
                      <p className="popcorn-card__desc">{item.description}</p>
                      <p className="popcorn-card__price">{formatPrice(item.price)}</p>
                    </div>
                    <div className="popcorn-card__qty">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{quantities[item.id] || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Snacks */}
          {concessions.snack?.length > 0 && (
            <section className="popcorn-section">
              <h2 className="popcorn-section-title">ĐỒ ĂN NHẸ</h2>
              <div className="popcorn-grid">
                {concessions.snack.map((item) => (
                  <div key={item.id} className="popcorn-card">
                    <div className="popcorn-card__image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <span className="popcorn-card__emoji">{getConcessionEmoji('snack')}</span>
                      )}
                    </div>
                    <div className="popcorn-card__info">
                      <h3 className="popcorn-card__name">{item.name}</h3>
                      <p className="popcorn-card__desc">{item.description}</p>
                      <p className="popcorn-card__price">{formatPrice(item.price)}</p>
                    </div>
                    <div className="popcorn-card__qty">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{quantities[item.id] || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Cart Summary */}
        {totalItems > 0 && (
          <div className="popcorn-cart">
            <div className="popcorn-cart__content">
              <div className="popcorn-cart__info">
                <span className="popcorn-cart__count">{totalItems} sản phẩm</span>
                <span className="popcorn-cart__total">{formatPrice(total)}</span>
              </div>
              <div className="popcorn-cart__actions">
                <button 
                  className="popcorn-cart__btn popcorn-cart__btn--secondary"
                  onClick={() => {
                    if (!user && !userLoading) {
                      router.push("/login?redirect=/popcorn-drink");
                      return;
                    }
                    
                    // Get all selected items
                    const allItems = [
                      ...(concessions.combo || []),
                      ...(concessions.drink || []),
                      ...(concessions.popcorn || []),
                      ...(concessions.snack || []),
                    ];
                    
                    const selectedItems = allItems
                      .filter(item => quantities[item.id] > 0)
                      .map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: quantities[item.id],
                        description: item.description,
                      }));
                    
                    if (selectedItems.length === 0) return;
                    
                    // Add to cart
                    const branch = branches.find(b => b.id === Number(selectedBranch));
                    addToCart({
                      type: 'concession',
                      branch: branch ? { id: branch.id, name: branch.name, city: branch.city } : null,
                      items: selectedItems,
                      total: total,
                      totalItems: totalItems,
                    });
                    
                    // Clear quantities
                    setQuantities({});
                  }}
                >
                  THÊM VÀO GIỎ
                </button>
                <button 
                  className="popcorn-cart__btn popcorn-cart__btn--primary"
                  onClick={() => {
                    if (!user && !userLoading) {
                      router.push("/login?redirect=/popcorn-drink");
                      return;
                    }
                    
                    // Get all selected items
                    const allItems = [
                      ...(concessions.combo || []),
                      ...(concessions.drink || []),
                      ...(concessions.popcorn || []),
                      ...(concessions.snack || []),
                    ];
                    
                    const selectedItems = allItems
                      .filter(item => quantities[item.id] > 0)
                      .map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: quantities[item.id],
                        description: item.description,
                      }));
                    
                    if (selectedItems.length === 0) return;
                    
                    // Add to cart
                    const branch = branches.find(b => b.id === Number(selectedBranch));
                    addToCart({
                      type: 'concession',
                      branch: branch ? { id: branch.id, name: branch.name, city: branch.city } : null,
                      items: selectedItems,
                      total: total,
                      totalItems: totalItems,
                    });
                    
                    // Clear quantities and go to checkout
                    setQuantities({});
                    router.push("/checkout");
                  }}
                >
                  ĐẶT HÀNG NGAY
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


