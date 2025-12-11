// ... (imports remain same)
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

      {/* İSİM TABELASI - Metalik Gri */}
      <div className="absolute top-0 z-40 bg-zinc-300 px-4 py-2 rounded shadow-lg border-2 border-zinc-500 transform -rotate-2 group-hover:rotate-0 transition-transform origin-center">
        <span className="font-cinzel text-zinc-800 font-bold text-sm tracking-widest flex items-center gap-2">
          <span></span> {username}
        </span>
        {/* Zincirler */}
        <div className="absolute -bottom-4 left-2 w-1 h-4 bg-zinc-500"></div>
        <div className="absolute -bottom-4 right-2 w-1 h-4 bg-zinc-500"></div>
      </div>

      {/* 1. DİREK - Koyu Gri/Siyah */}
      <div className="absolute bottom-0 w-4 h-48 bg-zinc-800 rounded-b-lg z-0" />

      {/* 2. KUTU GÖVDESİ - Metalik Koyu Gri */}
      <div className="absolute bottom-[140px] w-48 h-32 bg-zinc-700 rounded-t-full rounded-b-lg shadow-2xl z-10 flex items-center justify-center border-b-4 border-zinc-900">

        {/* Bayrak (Kırmızı Kalabilir - Dikkat Çekici) */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: messageCount > 0 ? -90 : 0 }}
          className="absolute right-[-12px] bottom-4 w-2 h-16 bg-red-600 rounded-full origin-bottom z-0 shadow-md border border-red-800"
        >
          <div className="absolute top-0 w-4 h-3 bg-red-600 -left-1 rounded-sm" />
        </motion.div>
      </div>

      {/* 3. İÇ KISIM (Karanlık) */}
      <div className="absolute bottom-[144px] w-44 h-28 bg-black rounded-t-full rounded-b-md z-20 overflow-hidden flex items-center justify-center">
        {messageCount > 0 && !isOpen && (
          <div className="w-32 h-4 bg-white opacity-10 rotate-3 translate-y-8 blur-[1px]"></div>
        )}
      </div>

      {/* 4. KUTU KAPAĞI - Daha Açık Gri (Contrast için) */}
      <motion.div
        initial={{ rotateX: 0, rotateY: 0 }}
        animate={{
          rotateX: isOpen ? 110 : 0,
          rotateY: isLocked ? [0, -5, 5, -5, 0] : 0
        }}
        transition={{
          rotateX: { type: "spring", stiffness: 100 },
          rotateY: { duration: 0.5, ease: "easeInOut" }
        }}
        style={{ transformOrigin: "bottom" }}
        className="absolute bottom-[140px] w-48 h-32 bg-zinc-600 rounded-t-full rounded-b-lg z-30 border-t border-white/10 flex flex-col items-center justify-center shadow-inner"
      >
        <div className="w-32 h-20 border-2 border-zinc-500 rounded-t-full opacity-50 mt-4"></div>
        <div className="w-4 h-4 bg-zinc-800 rounded-full mt-2 shadow-[0_2px_0_rgba(255,255,255,0.1)]"></div>

        {/* Mesaj Sayısı Badge */}
        <div className="absolute bottom-8 bg-red-700 text-white w-10 h-10 flex items-center justify-center rounded-full border-2 border-red-900 shadow-lg">
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
          <div className="w-32 h-20 bg-zinc-100 border-2 border-zinc-400 shadow-xl flex items-center justify-center transform rotate-1">
            {/* Mektup detayı */}
            <div className="w-24 h-1 bg-zinc-300 rounded mb-1"></div>
            <div className="w-16 h-1 bg-zinc-300 rounded"></div>
          </div>
        </motion.div>
      )}

    </div>
  );
}