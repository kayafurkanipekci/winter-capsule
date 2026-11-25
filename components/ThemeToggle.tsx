"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

function PixelSun({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className="pixelated block"
      aria-hidden="true"
    >
      {/* Rays */}
      <rect x="5" y="0" width="2" height="2" fill="#f59e0b" />
      <rect x="5" y="10" width="2" height="2" fill="#f59e0b" />
      <rect x="0" y="5" width="2" height="2" fill="#f59e0b" />
      <rect x="10" y="5" width="2" height="2" fill="#f59e0b" />
      <rect x="2" y="2" width="1" height="1" fill="#f59e0b" />
      <rect x="9" y="2" width="1" height="1" fill="#f59e0b" />
      <rect x="2" y="9" width="1" height="1" fill="#f59e0b" />
      <rect x="9" y="9" width="1" height="1" fill="#f59e0b" />
      {/* Core */}
      <rect x="4" y="3" width="4" height="6" fill="#d97706" />
      <rect x="3" y="4" width="6" height="4" fill="#d97706" />
      <rect x="4" y="4" width="4" height="4" fill="#fbbf24" />
      <rect x="4" y="4" width="2" height="2" fill="#fef08a" />
    </svg>
  );
}

function PixelMoon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className="pixelated block"
      aria-hidden="true"
    >
      <rect x="4" y="1" width="4" height="1" fill="#2b1b17" />
      <rect x="2" y="2" width="3" height="2" fill="#2b1b17" />
      <rect x="1" y="4" width="2" height="4" fill="#2b1b17" />
      <rect x="2" y="8" width="3" height="2" fill="#2b1b17" />
      <rect x="4" y="10" width="5" height="1" fill="#2b1b17" />
      <rect x="4" y="2" width="3" height="1" fill="#fbbf24" />
      <rect x="3" y="3" width="3" height="2" fill="#fbbf24" />
      <rect x="2" y="4" width="3" height="4" fill="#fbbf24" />
      <rect x="3" y="8" width="4" height="2" fill="#fbbf24" />
      <rect x="7" y="9" width="2" height="1" fill="#f59e0b" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-16 h-8 cursor-pointer p-1 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] transition-colors duration-200 flex items-center ${
        isDark ? "bg-[#142d21]" : "bg-[#60a5fa]"
      }`}
    >
      {/* Background pixel stars (dark) or pixel cloud/snow (light) */}
      {isDark ? (
        <span className="pointer-events-none absolute left-2 inset-y-0 flex items-center gap-1">
          <span className="w-1 h-1 bg-[#fbbf24]" />
          <span className="w-1.5 h-1.5 bg-[#fef08a] -mt-2" />
        </span>
      ) : (
        <span className="pointer-events-none absolute right-2 inset-y-0 flex items-center gap-1">
          <span className="w-2 h-1.5 bg-white/90 mt-1" />
          <span className="w-1 h-1 bg-white/80 -mt-2" />
        </span>
      )}

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        animate={{ x: isDark ? 28 : 0 }}
        className="w-5 h-5 bg-[#f4e4bc] border-2 border-[#2b1b17] flex items-center justify-center relative z-10"
      >
        {isDark ? <PixelMoon size={12} /> : <PixelSun size={12} />}
      </motion.div>
    </button>
  );
}
