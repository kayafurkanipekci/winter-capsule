"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SnowEffect from "@/components/SnowEffect";
import LetterReader from "@/components/LetterReader";
import Mailbox from "@/components/Mailbox";
import { Copy, Check, HelpCircle, Share2 } from "lucide-react";
import ShareDrawer from "@/components/ShareDrawer";

// TEST İÇİN TARİHİ GEÇMİŞ BİR TARİH YAP (Örn: "2023-01-01")
// GERÇEK TARİH: "2026-01-01T00:00:00"
const TARGET_DATE = new Date("2026-01-01T00:00:00").getTime();

interface Message {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
  receiver: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PersonalDashboard({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  // --- DURUMLAR ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  // Görünüm ve Mantık Durumları
  const [timeLeft, setTimeLeft] = useState("");
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);

  // Hangi mektup okunuyor? (Obje olarak tutuyoruz ki ID'sine erişebilelim)
  const [currentLetter, setCurrentLetter] = useState<Message | null>(null);
  const [viewMode, setViewMode] = useState<"mailbox" | "grid">("mailbox");

  // Drawer Durumları
  const [showForgotDrawer, setShowForgotDrawer] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean, message: string }>({ show: false, message: "" });
  const [emailCopied, setEmailCopied] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);

  // Okunmamış mektup sayısı (Rozet ve kilit mantığı için)
  const unreadCount = messages.filter(m => !m.is_read).length;

  // --- 1. SAYAÇ ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = TARGET_DATE - now;

      if (distance < 0) {
        setIsTimeUp(true);
        setTimeLeft("Mühürler Kırıldı!");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setIsTimeUp(false);
        setTimeLeft(`${days} gün ${hours} saat`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. GİRİŞ VE VERİ ÇEKME ---

  const performLogin = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      const { data: user, error: userError } = await supabase
        .from("users").select("pin").eq("username", username).single();

      if (userError || !user) {
        setError("Kutu bulunamadı!");
        setLoading(false);
        return false;
      } else if (user.pin === pin) {
        setIsAuthenticated(true);
        fetchMessages();
        setLoading(false);
        return true;
      } else {
        // Hata mesajını state'e koy ama hemen gösterme, manuel basarsa göster
        // Ama "otomatik girsin" dendi, yanlışsa "değilse girmesin" dendi.
        // Otomatik denemede hata göstermeyelim, sadece girmesin.
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  // Şifre 4 hane olunca otomatik dene
  useEffect(() => {
    if (pinInput.length === 4) {
      performLogin(pinInput);
    }
  }, [pinInput]);

  const handleManualLogin = async () => {
    if (pinInput.length < 4) {
      setError("Lütfen 4 haneli şifreni gir.");
      return;
    }

    // Manuel basınca hata mesajı göstermeliyiz
    setLoading(true);
    const { data: user, error: userError } = await supabase
      .from("users").select("pin").eq("username", username).single();

    if (userError || !user) {
      setError("Kutu bulunamadı!");
    } else if (user.pin !== pinInput) {
      setError("Yanlış şifre!");
      setPinInput(""); // İsteğe bağlı, şifreyi temizle
    } else {
      // Doğruysa zaten useEffect yakalar veya burası da yapabilir
      setIsAuthenticated(true);
      fetchMessages();
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("receiver", username)
      .order("created_at", { ascending: true }); // ESKİDEN YENİYE SIRALI (İlk atılan ilk okunur)
    if (data) setMessages(data);
  };

  // --- BİLDİRİM DRAWER ---
  const showNotification = (msg: string) => {
    setNotification({ show: true, message: msg });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000); // 3 saniye sonra kapat
  };

  // --- 3. KUTUYA TIKLAMA (Sıradaki Mektubu Getir) ---
  const handleMailboxClick = () => {
    if (!isTimeUp) {
      showNotification(`Kutu kilitli! ${timeLeft} sonra açılacak.`);
      return;
    }

    // Eğer okunacak mektup kalmadıysa
    if (unreadCount === 0) {
      if (messages.length > 0) {
        showNotification("Tüm mektuplar okundu! Aşağıdan hepsine bakabilirsin.");
      } else {
        showNotification("Posta kutun bomboş 😔");
      }
      return;
    }

    // SIRADAKİ OKUNMAMIŞ MEKTUBU BUL
    const nextMessage = messages.find(m => !m.is_read);

    if (nextMessage) {
      setIsMailboxOpen(true);

      // Animasyon bitince mektubu aç
      setTimeout(() => {
        setCurrentLetter(nextMessage); // Okuyucuyu aç

        // Kapağı kapat
        setTimeout(() => setIsMailboxOpen(false), 500);
      }, 1200);
    }
  };

  // --- 4. MEKTUP KAPATILINCA (Okundu İşaretle) ---
  const handleCloseLetter = async () => {
    if (!currentLetter) return;

    // 1. Ekrandan kaldır
    const letterId = currentLetter.id;
    setCurrentLetter(null);

    // 2. Eğer zaten okunmuşsa işlem yapma (Matris modundan açıldıysa)
    if (currentLetter.is_read) return;

    // 3. Veritabanında "okundu" yap
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", letterId);

    // 4. Ekrandaki listeyi güncelle (Anlık olarak sayıyı düşürmek için)
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === letterId ? { ...msg, is_read: true } : msg
      )
    );
  };

  const myEmail = "kayafurkanipekci@gmail.com"; // Örnek mail

  // --- KİLİT EKRANI ---
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <SnowEffect />
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="z-10 bg-[#f4e4bc] p-8 rounded shadow-2xl border-4 border-[#3e2723] w-full max-w-sm text-center relative">
          <h1 className="font-cinzel text-2xl text-[#3e2723] font-bold mb-2">{username}</h1>

          <div className="relative mb-6">
            <input
              type="text" // iOS klavye sorunu olmasın diye text, ama gizleyebiliriz
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPinInput(val);
                if (val.length < 4) setError(""); // Silerken hatayı temizle
              }}
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 text-center text-2xl tracking-[1em] text-[#3e2723] outline-none font-bold placeholder-amber-900/20"
              placeholder="****"
              style={{ WebkitTextSecurity: "disc" } as any} // Password mask on text input
            />
          </div>

          {error && <p className="text-red-800 font-bold text-sm mb-4 animate-shake">{error}</p>}

          <button
            onClick={handleManualLogin}
            className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#5d4037] transition-all"
          >
            {loading ? "GİRİLİYOR..." : "GİRİŞ YAP"}
          </button>

          <button
            onClick={() => setShowForgotDrawer(true)}
            className="mt-4 text-[#8b7355] text-xs font-merriweather hover:text-[#5d4037] flex items-center justify-center gap-1 w-full"
          >
            <HelpCircle size={12} />
            Şifremi Unuttum
          </button>
        </motion.div>

        {/* FORGOT PASSWORD DRAWER */}
        <AnimatePresence>
          {showForgotDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={() => setShowForgotDrawer(false)}
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000]"
              >
                <div className="w-12 h-1 bg-[#8b7355]/30 rounded-full mx-auto mb-6"></div>
                <h3 className="font-cinzel text-xl text-[#3e2723] font-bold text-center mb-2">Şifreni mi unuttun?</h3>
                <p className="font-merriweather text-[#5d4037] text-center text-sm mb-6">
                  Kutunu açman için sana yardımcı olabilirim. Aşağıdaki adrese mail atman yeterli.
                </p>

                <div
                  onClick={() => {
                    navigator.clipboard.writeText(myEmail);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="bg-[#e6d5aa]/50 p-4 rounded border border-[#8b7355]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="font-mono text-[#3e2723] text-sm">{myEmail}</span>
                  <div className="text-[#8b0000]">
                    {emailCopied ? <Check size={20} /> : <Copy size={20} />}
                  </div>
                </div>
                {emailCopied && <p className="text-green-700 text-xs text-center mt-2 font-bold">Kopyalandı!</p>}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main >
    );
  }

  // --- ANA EKRAN ---
  return (
    <main className="relative min-h-screen bg-background overflow-y-auto custom-scrollbar flex flex-col items-center p-4">
      <SnowEffect />

      {/* Mektup Okuyucu */}
      <AnimatePresence>
        {currentLetter && (
          <LetterReader
            content={currentLetter.content}
            onClose={handleCloseLetter} // Kapatınca okundu sayacak
          />
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-6 z-50 flex gap-4">
        <Link href="/" className="text-[#3e2723] dark:text-amber-500/50 hover:text-[#5d4037] dark:hover:text-amber-400 font-cinzel text-sm transition-colors">← Çıkış</Link>
        <button onClick={() => setShowShareDrawer(true)} className="text-[#3e2723] dark:text-amber-200/80 hover:text-[#5d4037] dark:hover:text-white font-cinzel text-sm border-b border-dashed border-[#3e2723] dark:border-amber-500/30 transition-colors flex items-center gap-1">
          <Share2 size={14} /> Paylaş
        </button>
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center mt-12 gap-8">

        {/* Başlık */}
        <div className="text-center">
          <div className="inline-block bg-[#f4e4bc] dark:bg-black/40 px-6 py-2 rounded-full border border-[#3e2723] dark:border-amber-500/30 backdrop-blur-md mb-4 shadow-md dark:shadow-none">
            <p className="font-cinzel text-[#3e2723] dark:text-amber-100 text-lg">
              {isTimeUp ? "Mühürler Açıldı" : ` ${timeLeft}`}
            </p>
          </div>

          {/* MATRİS BUTONU (Sadece hepsi okunduğunda görünür) */}
          {isTimeUp && unreadCount === 0 && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 justify-center mt-2"
            >
              <button
                onClick={() => setViewMode("mailbox")}
                className={`px-4 py-2 rounded font-cinzel text-sm transition-colors ${viewMode === 'mailbox' ? 'bg-amber-600 text-white' : 'bg-amber-900/40 text-amber-200 hover:bg-amber-800'}`}
              >
                Posta Kutusu
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded font-cinzel text-sm transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-white' : 'bg-amber-900/40 text-amber-200 hover:bg-amber-800'}`}
              >
                Tüm Mektuplar
              </button>
            </motion.div>
          )}
        </div>

        {/* --- MOD 1: POSTA KUTUSU --- */}
        {viewMode === "mailbox" && (
          <div className="mt-12 flex flex-col items-center gap-8">
            <Mailbox
              username={username}
              messageCount={unreadCount} // Artık sadece OKUNMAMIŞ sayısını gösteriyoruz
              isLocked={!isTimeUp}
              onClick={handleMailboxClick}
              isOpen={isMailboxOpen}
            />

            <div className="text-center space-y-2">
              <p className="font-merriweather text-[#5d4037] dark:text-amber-100/40 text-sm max-w-xs italic">
                {isTimeUp
                  ? (unreadCount > 0 ? "Kutuya tıkla, mektupları sırayla oku." : "Tüm mektupları bitirdin!")
                  : "Mektuplar burada güvenle saklanıyor."}
              </p>

              {/* Kalan mesaj bilgisi */}
              {isTimeUp && unreadCount > 0 && (
                <p className="text-[#8b0000] dark:text-amber-500 font-bold text-xs animate-pulse">
                  {unreadCount} okunmamış mektubun var
                </p>
              )}
            </div>
          </div>
        )}

        {/* --- MOD 2: MATRİS (GRID) --- */}
        {viewMode === "grid" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20"
          >
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setCurrentLetter(msg)} // Okunmuş olsa bile tekrar açabilsin
                className="bg-[#f4e4bc] p-6 rounded shadow-lg border-2 border-[#8b7355] cursor-pointer hover:scale-105 hover:rotate-1 transition-transform group relative overflow-hidden h-40 flex flex-col justify-between"
              >
                {/* Zarfın Kenarı */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#8b0000] transform rotate-45 translate-x-4 -translate-y-4"></div>

                <p className="font-merriweather text-[#3e2723] text-sm line-clamp-3 opacity-70 italic">
                  "{msg.content}"
                </p>

                <div className="flex justify-between items-end mt-2">
                  <span className="text-[10px] text-[#8b7355] font-bold">ANONİM</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border border-[#5d4037] ${msg.is_read ? 'bg-gray-500' : 'bg-[#8b0000]'}`}>
                    <span className="text-white text-[8px]">{msg.is_read ? '✓' : '25'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* NOTIFICATION DRAWER / TOAST */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md"
            >
              <div className="bg-[#f4e4bc] border-l-4 border-[#8b0000] p-4 shadow-2xl rounded text-[#3e2723] font-cinzel font-bold text-center flex items-center justify-center gap-2">
                <span>🔔</span>
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <ShareDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        username={username}
      />
    </main>
  );
}
