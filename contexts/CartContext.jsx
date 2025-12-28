"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("lmk_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Filter out expired showtimes for ticket items
        const now = new Date();
        const validItems = parsed.filter(item => {
          if (item.type === 'ticket' && item.showtime?.start_time) {
            return new Date(item.showtime.start_time) > now;
          }
          return true; // Keep non-ticket items
        });
        setCart(validItems);
      } catch (e) {
        console.error("Failed to parse cart:", e);
        localStorage.removeItem("lmk_cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("lmk_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("lmk_cart");
    }
  }, [cart]);

  const addToCart = useCallback((item) => {
    const itemWithType = { 
      ...item, 
      type: item.type || 'ticket', 
      id: item.id || Date.now() 
    };
    
    setCart(prevCart => {
      // For tickets, check if same showtime already in cart
      if (itemWithType.type === 'ticket') {
        const existingIndex = prevCart.findIndex(
          c => c.type === 'ticket' && c.showtime?.id === item.showtime?.id
        );
        
        if (existingIndex !== -1) {
          // Update existing item
          const newCart = [...prevCart];
          newCart[existingIndex] = itemWithType;
          return newCart;
        }
      }
      
      return [...prevCart, itemWithType];
    });
    
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(c => c.id !== itemId));
  }, []);

  const updateCartItem = useCallback((itemId, updates) => {
    setCart(prevCart => prevCart.map(c => 
      c.id === itemId ? { ...c, ...updates } : c
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("lmk_cart");
  }, []);

  // Calculate item total - reusable function
  const calculateItemTotal = useCallback((item) => {
    if (item.type === 'ticket') {
      // Use seatData prices (from ticket_prices table)
      const ticketTotal = item.seatData?.length > 0
        ? item.seatData.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
        : (item.seats?.length || 0) * (Number(item.showtime?.base_price) || 65000);
      
      const concessionTotal = Object.entries(item.concessions || {}).reduce((sum, [id, qty]) => {
        if (!qty || qty <= 0) return sum;
        const concession = item.concessionItems?.find(c => c.id === Number(id));
        return sum + (concession ? Number(concession.price) * qty : 0);
      }, 0);
      
      return ticketTotal + concessionTotal;
    } else if (item.type === 'concession') {
      return Number(item.total) || 0;
    } else if (item.type === 'event' || item.type === 'service') {
      return Number(item.price) || 0;
    }
    return 0;
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
  }, [cart, calculateItemTotal]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => {
      if (item.type === 'ticket') {
        return count + (item.seats?.length || item.seatData?.length || 0);
      } else if (item.type === 'concession') {
        return count + (item.totalItems || 1);
      } else {
        return count + 1;
      }
    }, 0);
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      isOpen,
      setIsOpen,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getCartTotal,
      getCartCount,
      calculateItemTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

