"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 14 }).map(() => {
      const initX = Math.random() * 1400;
      const initY = Math.random() * 800;
      const ax1 = Math.random() * 800;
      const ax2 = Math.random() * 800 - 200;
      const ax3 = Math.random() * 800;
      const ay1 = Math.random() * 1400;
      const ay2 = Math.random() * 1400 + 100;
      const ay3 = Math.random() * 1400;
      const duration = 8 + Math.random() * 6;
      const delay = Math.random() * 4;
      return { initX, initY, ax: [ax1, ax2, ax3], ay: [ay1, ay2, ay3], duration, delay };
    });
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-purple-600/30 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 h-[36rem] w-[36rem] rounded-full bg-pink-600/30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/3 h-[40rem] w-[40rem] rounded-full bg-blue-600/30 blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07050d]" />
      {/* Floating particles (render only after mount to avoid SSR/client randomness mismatch) */}
      {mounted && particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_10px_2px_rgba(232,121,249,0.6)]"
          initial={{ x: p.initX, y: p.initY, opacity: 0 }}
          animate={{ y: p.ax, x: p.ay, opacity: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </div>
  );
}
