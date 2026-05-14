"use client";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-purple-600/30 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 h-[36rem] w-[36rem] rounded-full bg-pink-600/30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/3 h-[40rem] w-[40rem] rounded-full bg-blue-600/30 blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07050d]" />
      {/* Floating particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-fuchsia-400/70 shadow-[0_0_10px_2px_rgba(232,121,249,0.6)]"
          initial={{ x: Math.random() * 1400, y: Math.random() * 800, opacity: 0 }}
          animate={{
            y: [Math.random() * 800, Math.random() * 800 - 200, Math.random() * 800],
            x: [Math.random() * 1400, Math.random() * 1400 + 100, Math.random() * 1400],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 4 }}
        />
      ))}
    </div>
  );
}
