"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Hydration mismatch hatasını önlemek için
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <div
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative w-16 h-8 rounded-full cursor-pointer p-1 transition-colors duration-300 ${isDark ? "bg-[#3e2723]" : "bg-sky-400"
                }`}
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className={`w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center relative z-10`}
                style={{
                    boxShadow: isDark
                        ? "0 0 10px 2px rgba(255, 255, 255, 0.2)"
                        : "0 0 10px 2px rgba(255, 215, 0, 0.4)"
                }}
                animate={{ x: isDark ? 32 : 0 }}
            >
                {isDark ? (
                    <Moon size={14} className="text-[#3e2723]" />
                ) : (
                    <Sun size={14} className="text-orange-400" />
                )}
            </motion.div>

            {/* Arka plan ikonları (sabit) */}
            <Sun size={14} className="absolute left-2 top-2 text-white/50 z-0" />
            <Moon size={14} className="absolute right-2 top-2 text-amber-100/30 z-0" />
        </div>
    );
}
