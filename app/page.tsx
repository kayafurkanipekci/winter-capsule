"use client";

import { useState } from "react";
import SnowEffect from "@/components/SnowEffect";
import LetterEditor from "@/components/LetterEditor";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase"; // Bağlantımızı çağırdık
import Link from "next/link";

export default function Home() {
  const [viewState, setViewState] = useState<"home" | "writing" | "success">("home");
  const [isSending, setIsSending] = useState(false); // Gönderiliyor mu kontrolü

  const handleSeal = async (message: string) => {
    setIsSending(true); // Yükleniyor moduna geç

    try {
      // 1. Veritabanına Kaydet
      const { error } = await supabase
        .from('messages') // 'messages' tablosuna git
        .insert([
          { 
            content: message,
            is_read: false // Okunmadı olarak işaretle
          }
        ]);

      if (error) {
        console.error("Hata oldu:", error);
        alert("Bir aksilik oldu, mektup kuşun ayağından düştü! Tekrar dene.");
        setIsSending(false);
        return;
      }

      // 2. Başarılıysa ekranı değiştir
      setViewState("success");
      
    } catch (e) {
      console.error("Bilinmeyen hata:", e);
      alert("Bağlantı koptu.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <SnowEffect />

      <AnimatePresence mode="wait">
        
        {/* 1. GİRİŞ EKRANI */}
        {viewState === "home" && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 text-center space-y-8 max-w-2xl px-6"
          >
            <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              Zaman Kapsülü
            </h1>
            <p className="font-merriweather text-lg md:text-xl text-[#e8e4d9] opacity-90 italic">
              "Yeni yıl için bir yeni yıl mesajı bırak. <br/>Ama dikkat et: 31 Aralık'a kadar okunamaz!"
            </p>
            <button 
              onClick={() => setViewState("writing")}
              className="mt-8 px-8 py-4 bg-[#3e2723] border border-amber-500/30 text-amber-100 rounded-lg font-cinzel text-xl hover:bg-[#5d4037] hover:scale-105 transition-all shadow-[0_0_20px_rgba(62,39,35,0.6)]"
            >
              Mektup Yaz 
            </button>
          </motion.div>
        )}

        {/* 2. MEKTUP YAZMA EKRANI */}
        {viewState === "writing" && (
          <motion.div 
            key="writing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-20 w-full"
          >
            <LetterEditor 
              onSeal={handleSeal}
              onCancel={() => setViewState("home")}
            />
          </motion.div>
        )}

        {/* 3. BAŞARI EKRANI */}
        {viewState === "success" && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 text-center space-y-6 bg-black/40 p-8 rounded-xl backdrop-blur-sm border border-amber-500/20"
          >
            <div className="text-6xl mb-4">🦅</div>
            <h2 className="font-cinzel text-3xl text-amber-100">Mektubun Yola Çıktı!</h2>
            <p className="font-merriweather text-[#e8e4d9]">
              Mesajın veritabanına güvenle kilitlendi.<br/>
              31 Aralık gecesi teslim edilecek.
            </p>
            
            <div className="pt-6 border-t border-white/10 mt-6 flex flex-col items-center gap-4">
  
              {/* Seçenek 1: Kendi Kutunu Oluştur (Ana Aksiyon) */}
              <Link 
                href="/create"
                className="px-6 py-3 bg-[#3e2723] border border-amber-500/50 text-amber-100 rounded hover:bg-[#5d4037] hover:scale-105 transition-all font-cinzel shadow-[0_0_15px_rgba(62,39,35,0.5)]"
              >
                Kendi Kapsülünü Oluştur
              </Link>

              {/* Seçenek 2: Tekrar Yaz (İkincil Aksiyon - Daha sade) */}
              <button 
                onClick={() => setViewState("home")}
                className="text-sm text-amber-500/60 hover:text-amber-400 hover:underline font-cinzel transition-colors"
              >
                Yeni Bir Mektup Daha Yaz
              </button>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}