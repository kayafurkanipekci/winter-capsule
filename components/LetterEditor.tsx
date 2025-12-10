"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PenLine } from "lucide-react";

interface LetterEditorProps {
  onSeal: (message: string) => void;
  onCancel: () => void;
}

export default function LetterEditor({ onSeal, onCancel }: LetterEditorProps) {
  const [message, setMessage] = useState("");
  // Durumlar: 'writing' (yazıyor), 'folding' (katlanıyor), 'sealed' (mühürlendi), 'flying' (uçuyor)
  const [status, setStatus] = useState<"writing" | "folding" | "sealed" | "flying">("writing");
  const [currentDay, setCurrentDay] = useState("25"); // Default server-side value/placeholder

  useEffect(() => {
    setCurrentDay(new Date().getDate().toString());
  }, []);

  const handleSealClick = () => {
    if (!message.trim()) return;

    // 1. Önce katlama animasyonunu başlat
    setStatus("folding");

    // 2. 1.5 saniye sonra mühürle
    setTimeout(() => {
      setStatus("sealed");
    }, 1500);

    // 3. 2.5 saniye sonra uçur
    setTimeout(() => {
      setStatus("flying");
    }, 2500);

    // 4. Animasyon bitince ana sayfaya haber ver (3.5 saniye sonra)
    setTimeout(() => {
      onSeal(message);
    }, 3500);
  };

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      {/* AŞAMA 1: YAZMA MODU 
          Kağıt açık, yazı yazılıyor.
      */}
      {status === "writing" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative w-full max-w-lg"
        >
          <div className="bg-[#f4e4bc] p-8 rounded-sm shadow-2xl relative overflow-hidden transform rotate-1 min-h-[400px]">
            {/* Kağıt Dokusu */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#8b7355_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="flex justify-between items-center mb-6 border-b border-[#8b7355]/30 pb-2">
              <span className="text-[#8b7355] font-cinzel text-sm font-bold tracking-widest">
                ANONİM MEKTUP
              </span>
              <PenLine className="w-5 h-5 text-[#8b7355]" />
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Geleceğe bir not bırak..."
              className="w-full h-64 bg-transparent resize-none outline-none text-[#5d4037] font-hand text-lg leading-relaxed placeholder-[#8b7355]/50 relative z-10"
              autoFocus
            />

            <div className="flex justify-end gap-4 mt-6 relative z-20">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-[#8b7355] font-cinzel text-sm hover:text-[#5d4037]"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSealClick}
                disabled={!message.trim()}
                className="px-6 py-2 bg-[#8b0000] text-[#f4e4bc] font-cinzel font-bold rounded shadow hover:bg-[#a50000] disabled:opacity-50 transition-colors"
              >
                MÜHÜRLE
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* AŞAMA 2, 3 ve 4: ZARF ANİMASYONU 
          Kağıt gitti, yerine Zarf geldi.
      */}
      {status !== "writing" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            status === "flying"
              ? { y: -800, opacity: 0, rotate: 10 } // Uçma efekti
              : { scale: 1, opacity: 1, y: 0 } // Durma efekti
          }
          transition={{ duration: 1, ease: "easeInOut" }}
          className="relative w-80 h-48 bg-[#f4e4bc] shadow-2xl flex items-center justify-center z-50"
        >
          {/* Zarfın Arka Kapağı (Üçgen katlamalar) */}
          <div className="absolute inset-0 border-[10px] border-[#e6d5aa] border-t-0 border-l-[160px] border-r-[160px] border-b-[96px] border-l-transparent border-r-transparent border-t-transparent"></div>

          {/* Zarfın Üst Kapağı (Kapanma Animasyonu) */}
          <motion.div
            initial={{ rotateX: 180, transformOrigin: "top" }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute top-0 left-0 w-full h-full border-t-[96px] border-l-[160px] border-r-[160px] border-[#d4c39b] border-l-transparent border-r-transparent border-b-transparent z-10"
          />

          {/* Kırmızı Mühür (Ortaya Çıkma Animasyonu) */}
          {status !== "folding" && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="absolute z-20 w-16 h-16 bg-[#8b0000] rounded-full shadow-lg flex items-center justify-center border-4 border-[#600000]"
            >
              <span className="text-[#f4e4bc] font-cinzel font-bold text-2xl">{currentDay}</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
