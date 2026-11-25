"use client";

import SnowEffect from "@/components/SnowEffect";
import PixelSprite from "@/components/PixelSprite";
import PixelCat from "@/components/PixelCat";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getTargetYear } from "@/lib/capsuleTime";
import { useI18n } from "@/lib/i18n/context";

export default function Home() {
  const targetYear = getTargetYear();
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <SnowEffect />

      <AnimatePresence mode="wait">
        {/* 1. Intro Screen */}
        <motion.div
          key="home"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="z-10 text-center space-y-6 max-w-2xl px-4"
        >
          {/* Cute Pixel Christmas Characters Row */}
          <div className="flex items-end justify-center gap-3 sm:gap-5 pt-4">
            <PixelSprite name="pine_tree" width={54} height={72} className="drop-shadow-[3px_3px_0_rgba(43,27,23,0.45)]" />
            <PixelCat size={56} className="drop-shadow-[3px_3px_0_rgba(43,27,23,0.45)]" />
            <PixelSprite name="gift_box" width={40} height={40} className="drop-shadow-[3px_3px_0_rgba(43,27,23,0.45)]" />
            <PixelSprite name="snowman" width={50} height={60} className="drop-shadow-[3px_3px_0_rgba(43,27,23,0.45)]" />
          </div>

          <div className="pixel-panel p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-center gap-3">
              <PixelSprite name="holly" width={32} height={24} className="hidden sm:inline-block" />
              <h1 className="font-cinzel text-4xl sm:text-6xl font-bold text-[#2b1b17] tracking-tight">
                {t.home.title}
              </h1>
              <PixelSprite name="holly" width={32} height={24} className="hidden sm:inline-block" />
            </div>

            <p className="font-merriweather text-base sm:text-lg text-[#5d4037] leading-relaxed">
              "{t.home.subtitle}"
              <span className="text-[#b91c1c] text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 mt-2 w-full font-cinzel font-bold">
                <AlertTriangle size={15} className="shrink-0" />
                {t.home.warning}
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-48 min-h-[52px] py-3 px-4 pixel-btn pixel-btn-wood font-cinzel text-base font-bold flex items-center justify-center"
              >
                {t.home.login}
              </Link>

              <Link
                href="/create"
                className="w-full sm:w-48 min-h-[52px] py-3 px-4 pixel-btn pixel-btn-red font-cinzel text-base font-bold flex items-center justify-center gap-2"
              >
                <PixelSprite name="envelope_sealed" width={20} height={14} />
                {t.home.register}
              </Link>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 opacity-85">
            <PixelSprite name="bell" width={18} height={18} />
            <p suppressHydrationWarning className="font-cinzel text-xs font-bold text-[#5d4037] dark:text-[#f4e4bc] uppercase tracking-widest">
              {t.home.lettersToYear(targetYear)}
            </p>
            <PixelSprite name="bell" width={18} height={18} />
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
