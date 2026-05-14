"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(null); // {code, discountPercent}
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ig_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(parsed.items || []);
        setCoupon(parsed.coupon || null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("ig_cart", JSON.stringify({ items, coupon }));
  }, [items, coupon]);

  const addItem = (item) => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), ...item }]);
    setOpen(true);
  };
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => { setItems([]); setCoupon(null); };
  const updateQty = (id, qty) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty, subtotal: i.pricePerUnit * qty } : i));

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, updateQty, coupon, setCoupon, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
