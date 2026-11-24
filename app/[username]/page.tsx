"use client";

import { useState, useEffect, use } from "react";
import SnowEffect from "@/components/SnowEffect";
import LetterEditor from "@/components/LetterEditor";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UserPage({ params }: PageProps) {
  const { t } = useI18n();
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  // EKRAN DURUMLARI: 'loading' | 'not_found' | 'intro' | 'writing' | 'success'
  const [viewState, setViewState] = useState<"loading" | "not_found" | "intro" | "writing" | "success">("loading");

  // Kullanıcı var mı kontrolü
  useEffect(() => {
    const checkUser = async () => {
      // Veritabanında bu isimde biri var mı?
      // İsim büyük/küçük harf duyarlı olabilir, tam eşleşme arıyoruz
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (error || !data) {
        setViewState("not_found"); // Kullanıcı YOK
      } else {
        setViewState("intro"); // Kullanıcı VAR, mektup yazabilirsin
      }
    };

    checkUser();
  }, [username]);

  const handleSeal = async (message: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content: message, is_read: false, receiver: username }]);

      if (error) throw error;
      setViewState("success");
    } catch (error) {
      console.error("Hata:", error);
      alert(t.userPage.sendError);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-background">
      <SnowEffect />

      <AnimatePresence mode="wait">

        {/* 1. YÜKLENİYOR */}
        {viewState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="font-cinzel text-amber-500 animate-pulse">{t.userPage.searchingBox}</p>
          </motion.div>
        )}

        {/* 2. KULLANICI BULUNAMADI (Hayalet Kutu Engelleme) */}
        {viewState === "not_found" && (
          <motion.div
            key="not_found"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center bg-[#f4e4bc] p-8 rounded shadow-2xl border-4 border-[#3e2723] max-w-md"
          >
            <HelpCircle size={40} className="mx-auto mb-4 text-[#8b0000]" />
            <h2 className="font-cinzel text-2xl text-[#3e2723] font-bold mb-2">{t.userPage.notFoundTitle}</h2>
            <p className="font-merriweather text-[#5d4037] mb-6">
              {t.userPage.notFoundDescription(username)}
            </p>
            <p className="font-merriweather text-[#5d4037] text-sm mb-6 italic">
              {t.userPage.claimPrompt}
            </p>

            <Link
              href="/create"
              className="block w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#5d4037] transition-colors"
            >
              {t.userPage.createWithName}
            </Link>

            <Link href="/" className="block mt-4 text-xs text-[#8b7355] hover:underline">
              {t.userPage.backHome}
            </Link>
          </motion.div>
        )}

        {/* 3. GİRİŞ EKRANI (Kullanıcı Varsa) */}
        {viewState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 text-center space-y-8 max-w-2xl px-6"
          >
            <h1 className="font-cinzel text-4xl md:text-6xl font-bold text-[#3e2723] dark:text-amber-400 drop-shadow-lg">
              {username}
            </h1>
            <p className="font-merriweather text-lg text-[#3e2723] dark:text-[#e8e4d9] opacity-90 italic">
              {t.userPage.introSubtitle}
            </p>
            <button
              onClick={() => setViewState("writing")}
              className="mt-8 px-8 py-4 bg-[#3e2723] text-amber-100 rounded-lg font-cinzel text-xl hover:scale-105 transition-all shadow-lg border border-[#5d4037] dark:border-amber-500/30"
            >
              {t.userPage.writeLetter}
            </button>
          </motion.div>
        )}

        {/* 4. MEKTUP YAZMA */}
        {viewState === "writing" && (
          <motion.div key="writing" className="z-20 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LetterEditor onSeal={handleSeal} onCancel={() => setViewState("intro")} />
          </motion.div>
        )}

        {/* 5. BAŞARI */}
        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center bg-black/50 p-8 rounded-xl backdrop-blur border border-amber-500/20"
          >
            <div className="text-6xl mb-4"></div>
            <h2 className="font-cinzel text-2xl text-amber-100 mb-2">{t.userPage.successTitle(username)}</h2>
            <Link href="/create" className="px-6 py-3 bg-amber-600/20 border border-amber-500/50 text-amber-200 rounded hover:bg-amber-600/40 transition-colors font-cinzel block mt-6">
              {t.userPage.createOwnBox}
            </Link>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}