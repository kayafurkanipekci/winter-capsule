"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface LetterReaderProps {
  content: string;
  onClose: () => void;
}

export default function LetterReader({ content, onClose }: LetterReaderProps) {
  const [currentDay, setCurrentDay] = useState("25");

  useEffect(() => {
    setCurrentDay(new Date().getDate().toString());
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative w-full max-w-lg bg-[#f4e4bc] p-8 rounded shadow-[0_0_50px_rgba(251,191,36,0.2)] rotate-1 border border-[#e6d5aa]"
      >
        {/* Kağıt Dokusu */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#8b7355_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Üst Kısım */}
        <div className="flex justify-between items-center mb-6 border-b border-[#8b7355]/30 pb-2">
          <span className="text-[#8b7355] font-cinzel text-sm font-bold tracking-widest">
            GEÇMİŞTEN BİR MESAJ
          </span>
          <button onClick={onClose} className="text-[#8b0000] font-bold text-xl hover:scale-110 transition-transform">
            ✕
          </button>
        </div>

        {/* Mesaj İçeriği */}
        <div className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="font-hand text-[#5d4037] text-lg leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {/* CSS İLE ÇİZİLMİŞ MÜHÜR (Resim yerine bu) */}
        <div className="mt-8 flex justify-end">
          <div className="relative w-20 h-20 bg-[#8b0000] rounded-full border-4 border-[#600000] shadow-lg flex items-center justify-center opacity-90 transform rotate-12">
            <div className="absolute inset-0 border border-[#a52a2a] rounded-full opacity-50 m-1"></div>
            <span className="text-[#cc7a7a] font-cinzel font-bold text-2xl drop-shadow-md">{currentDay}</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
