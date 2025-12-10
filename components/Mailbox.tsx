"use client";

import { motion } from "framer-motion";

interface MailboxProps {
  username: string;
  messageCount: number;
  isLocked: boolean;
  onClick: () => void;
  isOpen: boolean;
}

export default function Mailbox({ username, messageCount, isLocked, onClick, isOpen }: MailboxProps) {
  return (
    <div className="relative w-64 h-80 flex items-end justify-center cursor-pointer group" onClick={onClick}>

      {/* İSİM TABELASI (Artık en tepede asılı ve çok net) */}
      <div className="absolute top-0 z-40 bg-[#e6d5aa] px-4 py-2 rounded shadow-lg border-2 border-[#8b7355] transform -rotate-2 group-hover:rotate-0 transition-transform origin-center">
        <span className="font-cinzel text-[#3e2723] font-bold text-sm tracking-widest flex items-center gap-2">
          <span></span> {username}
        </span>
        {/* Zincirler (Süs) */}
        <div className="absolute -bottom-4 left-2 w-1 h-4 bg-gray-400"></div>
        <div className="absolute -bottom-4 right-2 w-1 h-4 bg-gray-400"></div>
      </div>

      {/* 1. DİREK */}
      <div className="absolute bottom-0 w-4 h-48 bg-[#2d1b15] rounded-b-lg z-0" />

      {/* 2. KUTU GÖVDESİ */}
      <div className="absolute bottom-[140px] w-48 h-32 bg-[#3e2723] rounded-t-full rounded-b-lg shadow-2xl z-10 flex items-center justify-center border-b-4 border-[#251510]">

        {/* Bayrak (Mektup varsa kalkar) */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: messageCount > 0 ? -90 : 0 }}
          className="absolute right-[-12px] bottom-4 w-2 h-16 bg-red-700 rounded-full origin-bottom z-0 shadow-md border border-red-900"
        >
          <div className="absolute top-0 w-4 h-3 bg-red-700 -left-1 rounded-sm" />
        </motion.div>
      </div>

      {/* 3. İÇ KISIM (Karanlık) */}
      <div className="absolute bottom-[144px] w-44 h-28 bg-black rounded-t-full rounded-b-md z-20 overflow-hidden flex items-center justify-center">
        {messageCount > 0 && !isOpen && (
          <div className="w-32 h-4 bg-white opacity-20 rotate-3 translate-y-8 blur-[1px]"></div>
        )}
      </div>

      {/* 4. KUTU KAPAĞI (Animasyon Düzeltildi) */}
      <motion.div
        initial={{ rotateX: 0, rotateY: 0 }}
        animate={{
          rotateX: isOpen ? 110 : 0,
          rotateY: isLocked ? [0, -5, 5, -5, 0] : 0 // Titreme
        }}
        transition={{
          rotateX: { type: "spring", stiffness: 100 }, // Kapak açılması yaylı olsun
          rotateY: { duration: 0.5, ease: "easeInOut" } // Titreme düz olsun (HATA ÇÖZÜMÜ BURASI)
        }}
        style={{ transformOrigin: "bottom" }}
        className="absolute bottom-[140px] w-48 h-32 bg-[#4e342e] rounded-t-full rounded-b-lg z-30 border-t border-white/10 flex flex-col items-center justify-center shadow-inner"
      >
        <div className="w-32 h-20 border-2 border-[#3e2723] rounded-t-full opacity-50 mt-4"></div>
        <div className="w-4 h-4 bg-[#1a100d] rounded-full mt-2 shadow-[0_2px_0_rgba(255,255,255,0.1)]"></div>

        {/* Mesaj Sayısı */}
        <div className="absolute bottom-8 bg-[#8b0000] text-[#f4e4bc] w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#5d4037] shadow-lg">
          <span className="font-cinzel font-bold text-lg">{messageCount}</span>
        </div>
      </motion.div>

      {/* 5. MEKTUP UÇUŞ ANİMASYONU */}
      {isOpen && messageCount > 0 && (
        <motion.div
          initial={{ y: -50, scale: 0.5, opacity: 0 }}
          animate={{ y: -150, scale: 1, opacity: 1, rotate: -10 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute bottom-[180px] z-50 pointer-events-none"
        >
          <div className="w-32 h-20 bg-[#f4e4bc] border-2 border-[#8b7355] shadow-xl flex items-center justify-center">
            <span className="text-2xl"></span>
          </div>
        </motion.div>
      )}

    </div>
  );
}