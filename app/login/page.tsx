"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import SnowEffect from "@/components/SnowEffect";
import { supabase } from "@/lib/supabase";
import { Copy, Check, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showErrorDrawer, setShowErrorDrawer] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);

    // Yardım için mail adresi
    const myEmail = "kayafurkanipekci@gmail.com";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUsername = username.trim();

        if (!trimmedUsername) return;

        setIsLoading(true);

        try {
            // Veritabanı kontrolü (Büyük/küçük harf duyarsız)
            // .ilike() kullanarak arıyoruz, böylece "Furkan" vs "furkan" fark etmez.
            // Ayrıca gerçek kullanıcı adını (data.username) alıp ona yönlendiriyoruz.
            const { data, error } = await supabase
                .from("users")
                .select("username")
                .ilike("username", trimmedUsername)
                .single();

            if (error || !data) {
                console.warn("Kullanıcı bulunamadı veya hata:", error);
                setShowErrorDrawer(true);
            } else {
                // Bulunan kullanıcının gerçek yazımıyla yönlendir
                router.push(`/dashboard/${data.username}`);
            }
        } catch (err) {
            console.error("Login kritik hata:", err);
            setShowErrorDrawer(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
            <SnowEffect />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 w-full max-w-md bg-[#f4e4bc] p-8 rounded shadow-2xl border-4 border-[#3e2723]"
            >
                <h1 className="font-cinzel text-3xl text-[#3e2723] text-center font-bold mb-2">{t.login.title}</h1>
                <p className="text-center font-merriweather text-[#5d4037] opacity-80 mb-6 italic text-sm">
                    {t.login.subtitle}
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block font-cinzel text-[#3e2723] font-bold mb-2">
                            {t.login.usernameLabel}
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t.login.usernamePlaceholder}
                            className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-3 text-[#3e2723] text-lg font-merriweather outline-none focus:border-[#8b0000] placeholder-amber-900/30"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#3e2723] text-amber-100 font-cinzel font-bold text-lg rounded hover:bg-[#5d4037] transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t.login.checking : t.login.submit}
                    </button>
                </form>

                <div className="mt-6 text-center pt-4 border-t border-[#8b7355]/20">
                    <p className="text-[#5d4037] text-sm mb-2 font-merriweather">{t.login.noBoxYet}</p>
                    <Link
                        href="/create"
                        className="text-[#8b0000] font-bold hover:underline font-cinzel text-sm"
                    >
                        {t.login.createFree}
                    </Link>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-[#8b7355] text-xs hover:text-[#5d4037] font-cinzel">← {t.login.backHome}</Link>
                </div>

            </motion.div>

            {/* ERROR / NOT FOUND DRAWER */}
            <AnimatePresence>
                {showErrorDrawer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                            onClick={() => setShowErrorDrawer(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000]"
                        >
                            <div className="w-12 h-1 bg-[#8b7355]/30 rounded-full mx-auto mb-6"></div>

                            <div className="text-center space-y-4">
                                <HelpCircle size={40} className="mx-auto mb-2 text-[#8b0000]" />
                                <h3 className="font-cinzel text-xl text-[#3e2723] font-bold">{t.login.notFound.title}</h3>
                                <p className="font-merriweather text-[#5d4037] text-sm">
                                    {t.login.notFound.description(username)} <br />
                                    {t.login.notFound.wrongSpelling}
                                </p>

                                <div className="flex flex-col gap-3 mt-6">
                                    {/* Seçenek 1: Yeni Oluştur */}
                                    <Link
                                        href="/create"
                                        className="w-full py-3 bg-[#8b0000] text-white font-cinzel font-bold rounded shadow hover:bg-[#a50000] transition-colors"
                                    >
                                        {t.login.notFound.createNew}
                                    </Link>

                                    {/* Seçenek 2: Tekrar Dene */}
                                    <button
                                        onClick={() => setShowErrorDrawer(false)}
                                        className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#5d4037] transition-colors"
                                    >
                                        {t.login.notFound.tryAgain}
                                    </button>
                                </div>

                                {/* Yardım Bölümü - Divider */}
                                <div className="relative pt-6 mt-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-[#8b7355]/20"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#f4e4bc] px-2 text-xs text-[#8b7355] font-cinzel">{t.login.notFound.helpDivider}</span>
                                    </div>
                                </div>

                                <p className="font-merriweather text-[#5d4037] text-xs">
                                    {t.login.notFound.forgotUsernamePrompt}
                                </p>

                                <div
                                    onClick={() => {
                                        navigator.clipboard.writeText(myEmail);
                                        setEmailCopied(true);
                                        setTimeout(() => setEmailCopied(false), 2000);
                                    }}
                                    className="bg-[#e6d5aa]/50 p-3 rounded border border-[#8b7355]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                                >
                                    <span className="font-mono text-[#3e2723] text-xs">{myEmail}</span>
                                    <div className="text-[#8b0000]">
                                        {emailCopied ? <Check size={16} /> : <Copy size={16} />}
                                    </div>
                                </div>
                                {emailCopied && <p className="text-green-700 text-[10px] font-bold animate-pulse">{t.login.notFound.copied}</p>}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    );
}
