"use client";

import SnowEffect from "@/components/SnowEffect";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

export default function Home() {

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <SnowEffect />

      <AnimatePresence mode="wait">

        {/* 1. GİRİŞ EKRANI */}
        <motion.div
          key="home"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="z-10 text-center space-y-8 max-w-2xl px-6"
        >
          <div className="relative">
            <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-[#3e2723] dark:text-amber-400 drop-shadow-[0_0_15px_rgba(62,39,35,0.2)] dark:drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              Zaman Kapsülü
            </h1>
            <div className="absolute -top-12 -right-8 text-6xl opacity-80 rotate-12"></div>
          </div>

          <p className="font-merriweather text-lg md:text-xl text-[#3e2723] dark:text-[#e8e4d9] opacity-90 italic leading-relaxed">
            "Yeni yıl için bir mesaj bırak.<br />
            <span className="text-[#8b0000] dark:text-amber-200/80 text-sm block mt-2 not-italic font-cinzel">⚠️ Dikkat: 31 Aralık'a kadar okunamaz!</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            {/* Giriş Yap Butonu */}
            <Link
              href="/login"
              className="w-48 py-4 bg-[#3e2723] border border-[#5d4037] dark:border-amber-500/30 text-[#f4e4bc] dark:text-amber-100 rounded-lg font-cinzel text-lg hover:bg-[#5d4037] hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span></span> Giriş Yap
            </Link>

            {/* Kayıt Ol Butonu */}
            <Link
              href="/create"
              className="w-48 py-4 bg-[#8b0000] border border-red-500/30 text-white rounded-lg font-cinzel text-lg hover:bg-[#a50000] hover:scale-105 transition-all shadow-[0_0_20px_rgba(139,0,0,0.4)] flex items-center justify-center gap-2"
            >
              <span></span> Kayıt Ol
            </Link>
          </div>

          <div className="pt-12 text-center opacity-70 dark:opacity-60">
            <p className="font-cinzel text-xs text-[#5d4037] dark:text-amber-100/50 uppercase tracking-widest">2026'ya Mektuplar</p>
          </div>

        </motion.div>

      </AnimatePresence>
    </main>
  );
}