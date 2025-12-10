"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SnowEffect() {
  const [mounted, setMounted] = useState(false);

  // Sayfa tamamen tarayıcıda yüklendi mi kontrol et
  useEffect(() => {
    setMounted(true);
  }, []);

  // Eğer sayfa henüz yüklenmediyse (Sunucu tarafındaysa) hiçbir şey gösterme
  if (!mounted) return null;

  // 50 tane kar tanesi için dizi oluştur
  const snowflakes = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((i) => (
        <motion.div
          key={i}
          initial={{
            y: -20, // Ekranın hemen üzerinden başla
            opacity: 0,
          }}
          animate={{
            y: "110vh", // Ekranın altına kadar düş (viewport height)
            opacity: [0, 1, 0.5, 0], // Görün, parla, kaybol
          }}
          transition={{
            duration: Math.random() * 10 + 10, // 10-20 saniye sürsün (daha yavaş ve huzurlu)
            repeat: Infinity,
            delay: Math.random() * 10, // Rastgele başlama
            ease: "linear",
          }}
          className="absolute w-1.5 h-1.5 bg-amber-100 rounded-full blur-[1px] shadow-[0_0_5px_rgba(251,191,36,0.8)]"
          style={{
            left: `${Math.random() * 100}%`, // Soldan % olarak rastgele konum
          }}
        />
      ))}
    </div>
  );
}