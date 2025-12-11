"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, Share2, Copy, Check, X, Instagram } from "lucide-react";

interface ShareDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export default function ShareDrawer({ isOpen, onClose, username }: ShareDrawerProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const storyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareUrl(`${window.location.origin}/${username}`);
        }
    }, [username]);

    const shareText = `Yeni yıl için bana anonim bir mesaj bırak!`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        setIsGenerating(true);
        try {
            if (storyRef.current) {
                // 1. Görseli oluştur
                const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });

                // 2. Blob'a çevir
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], "time-capsule-story.png", { type: "image/png" });

                // 3. Native Share dene
                if (navigator.share) {
                    await navigator.share({
                        title: 'Yılbaşı Kapsülü',
                        text: shareText,
                        url: shareUrl,
                        files: [file]
                    });
                } else {
                    // Desteklemiyorsa (Desktop) indir
                    const link = document.createElement('a');
                    link.download = 'yilbasi-kapsulu-hikaye.png';
                    link.href = dataUrl;
                    link.click();
                }
            }
        } catch (err) {
            console.error("Paylaşım hatası:", err);
            // Hata olursa düz link paylaşmayı dene
            if (navigator.share) {
                navigator.share({ title: 'Yılbaşı Kapsülü', text: shareText, url: shareUrl });
            } else {
                alert("Görsel oluşturulamadı, link kopyalandı.");
                handleCopy();
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const socialLinks = [
        {
            name: "WhatsApp",
            icon: "",
            url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
            color: "bg-green-100 text-green-700"
        },
        {
            name: "Twitter",
            icon: "",
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            color: "bg-blue-100 text-blue-700"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000] max-w-lg mx-auto"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-cinzel text-xl text-[#3e2723] font-bold">Paylaş</h3>
                            <button onClick={onClose} className="p-2 hover:bg-[#8b7355]/20 rounded-full text-[#5d4037]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* 1. HİKAYE PAYLAŞ BUTONU */}
                        <div className="mb-8">
                            <button
                                onClick={handleNativeShare}
                                disabled={isGenerating}
                                className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-full">
                                        <Instagram size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold font-cinzel text-sm">Hikaye İçin Görseli İndir</p>
                                        <p className="text-[10px] opacity-90">Instagram, Snapchat, WhatsApp</p>
                                    </div>
                                </div>
                                {isGenerating ? <div className="animate-spin text-white"></div> : <Download size={20} />}
                            </button>
                        </div>


                        {/* 2. DİĞER SOSYAL LİNKLER */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-3 rounded-lg ${social.color} font-bold text-sm hover:opacity-80 transition-opacity`}
                                >
                                    <span>{social.icon}</span>
                                    {social.name}
                                </a>
                            ))}
                        </div>

                        {/* 3. LİNK KOPYALA */}
                        <div
                            onClick={handleCopy}
                            className="bg-[#e6d5aa]/50 p-4 rounded-lg border border-[#8b7355]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                        >
                            <div className="flex flex-col overflow-hidden mr-4">
                                <span className="text-[10px] text-[#8b7355] font-bold mb-1">KUTU LİNKİ</span>
                                <span className="font-mono text-[#3e2723] text-sm truncate">
                                    {shareUrl}
                                </span>
                            </div>
                            <div className="text-[#8b0000]">
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </div>
                        </div>


                        {/* --- GİZLİ HİKAYE ŞABLONU (Ekranda görünmez, sadece resim üretilirken kullanılır) --- */}
                        <div className="fixed -left-[9999px] top-0">
                            <div
                                ref={storyRef}
                                className="w-[1080px] h-[1920px] bg-[#0a0f0d] flex flex-col items-center justify-center relative overflow-hidden"
                                style={{ fontFamily: 'serif' }} // Font yüklenmediyse native serif kullan
                            >
                                {/* Arkaplan Efekti */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-[#0a0f0d] to-[#0a0f0d]"></div>

                                {/* Kar Efekti (Statik Resim) */}
                                {[...Array(30)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute bg-sky-200 rounded-full blur-md opacity-60"
                                        style={{
                                            width: Math.random() * 20 + 10 + 'px',
                                            height: Math.random() * 20 + 10 + 'px',
                                            left: Math.random() * 100 + '%',
                                            top: Math.random() * 100 + '%'
                                        }}
                                    />
                                ))}

                                <div className="z-10 bg-[#f4e4bc] p-16 rounded-3xl shadow-[0_0_100px_rgba(251,191,36,0.3)] border-[8px] border-[#3e2723] text-center max-w-[800px]">
                                    <h1 className="text-6xl text-[#3e2723] font-bold mb-8 font-serif">Zaman Kapsülü</h1>
                                    <div className="w-full h-2 bg-[#8b0000] rounded-full mb-12 opacity-50"></div>

                                    <p className="text-4xl text-[#5d4037] mb-8 italic">
                                        "Bana 2026'da okumam için<br />bir mesaj bırak!"
                                    </p>

                                    <div className="bg-[#3e2723] text-[#f4e4bc] text-5xl py-8 px-12 rounded-xl inline-block font-bold mb-12 border-2 border-[#8b7355]">
                                        {username}
                                    </div>

                                    <p className="text-3xl text-[#8b7355] font-bold tracking-widest uppercase">
                                        GİZLİ & ANONİM
                                    </p>
                                </div>

                                <div className="absolute bottom-32 text-center">
                                    <p className="text-amber-100/50 text-3xl font-serif">Link Profilimde 🔗</p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
