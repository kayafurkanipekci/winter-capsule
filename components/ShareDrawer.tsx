"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, Copy, Check, X, Instagram, Link2 } from "lucide-react";
import PixelSprite from "./PixelSprite";
import { getTargetYear } from "@/lib/capsuleTime";
import { useI18n } from "@/lib/i18n/context";

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const STORY_SNOW_FLAKES = Array.from({ length: 28 }, (_, i) => ({
  size: i % 3 === 0 ? 18 : i % 2 === 0 ? 12 : 8,
  left: `${(i * 37) % 94 + 3}%`,
  top: `${(i * 53) % 92 + 4}%`,
}));

export default function ShareDrawer({ isOpen, onClose, username }: ShareDrawerProps) {
  const { t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/${username}`);
    }
  }, [username]);

  const shareText = t.shareDrawer.shareText;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    setIsGenerating(true);
    try {
      if (storyRef.current) {
        const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], t.shareDrawer.downloadFilename, { type: "image/png" });

        if (navigator.share) {
          await navigator.share({
            title: t.shareDrawer.shareTitle,
            text: shareText,
            url: shareUrl,
            files: [file],
          });
        } else {
          const link = document.createElement("a");
          link.download = t.shareDrawer.downloadFilename;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error("Share error:", err);
      if (navigator.share) {
        navigator.share({ title: t.shareDrawer.shareTitle, text: shareText, url: shareUrl });
      } else {
        alert(t.shareDrawer.imageErrorAlert);
        handleCopy();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      btnClass: "pixel-btn-green",
    },
    {
      name: "Twitter / X",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      btnClass: "pixel-btn-wood",
    },
  ];

  const targetYear = getTargetYear();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] pixel-panel p-6 max-w-lg mx-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b-2 border-[#8b7355]/40 pb-3">
              <div className="flex items-center gap-2">
                <PixelSprite name="gift_box" width={24} height={24} />
                <h3 className="font-cinzel text-xl text-[#2b1b17] font-bold">{t.shareDrawer.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 pixel-btn pixel-btn-parchment text-[#2b1b17]"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Story Share Button */}
            <div className="mb-4">
              <button
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="w-full pixel-btn pixel-btn-red p-4 flex items-center justify-between disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#fffdf7]/20 p-2 border-2 border-[#2b1b17]">
                    <Instagram size={22} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold font-cinzel text-sm">{t.shareDrawer.downloadStory}</p>
                    <p className="text-[11px] font-merriweather opacity-90">{t.shareDrawer.storyPlatforms}</p>
                  </div>
                </div>
                {isGenerating ? (
                  <PixelSprite name="santa_cat" width={24} height={24} className="animate-bounce" />
                ) : (
                  <Download size={20} />
                )}
              </button>
            </div>

            {/* 2. Social Links */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 p-3 pixel-btn ${social.btnClass} font-cinzel font-bold text-xs`}
                >
                  {social.name}
                </a>
              ))}
            </div>

            {/* 3. Copy Link */}
            <div
              onClick={handleCopy}
              className="pixel-inset p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex flex-col overflow-hidden mr-4">
                <span className="text-[10px] text-[#5d4037] font-cinzel font-bold mb-0.5">
                  {t.shareDrawer.boxLinkLabel}
                </span>
                <span className="font-mono text-[#2b1b17] text-xs truncate">
                  {shareUrl}
                </span>
              </div>
              <div className="text-[#b91c1c] shrink-0">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </div>
            </div>

            {/* Off-screen Pixel-Art Story Template (1080x1920) */}
            <div className="fixed -left-[9999px] top-0">
              <div
                ref={storyRef}
                className="w-[1080px] h-[1920px] bg-[#0a1410] flex flex-col items-center justify-center relative overflow-hidden"
                style={{ fontFamily: "var(--font-alice), monospace" }}
              >
                {/* Pixel Snowflakes */}
                {STORY_SNOW_FLAKES.map((flake, i) => (
                  <div
                    key={i}
                    className="absolute bg-[#cfe8ff] opacity-75"
                    style={{
                      width: `${flake.size}px`,
                      height: `${flake.size}px`,
                      left: flake.left,
                      top: flake.top,
                    }}
                  />
                ))}

                {/* Festive Pixel Characters Row */}
                <div className="z-10 flex items-end justify-center gap-10 mb-10">
                  <img
                    src="/pixel/pine_tree.png"
                    alt=""
                    width={144}
                    height={192}
                    style={{ imageRendering: "pixelated" }}
                  />
                  <img
                    src="/pixel/santa_cat.png"
                    alt=""
                    width={160}
                    height={160}
                    style={{ imageRendering: "pixelated" }}
                  />
                  <img
                    src="/pixel/snowman.png"
                    alt=""
                    width={140}
                    height={168}
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                {/* Main Pixel Parchment Card */}
                <div className="z-10 bg-[#f4e4bc] p-16 border-[14px] border-[#2b1b17] shadow-[20px_20px_0_#040806] text-center max-w-[840px] w-full">
                  <div className="flex items-center justify-center gap-6 mb-8">
                    <img
                      src="/pixel/holly.png"
                      alt=""
                      width={64}
                      height={48}
                      style={{ imageRendering: "pixelated" }}
                    />
                    <h1 className="text-6xl text-[#2b1b17] font-bold">
                      {t.shareDrawer.storyTitle}
                    </h1>
                    <img
                      src="/pixel/holly.png"
                      alt=""
                      width={64}
                      height={48}
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>

                  <div className="w-full h-3 bg-[#b91c1c] mb-10" />

                  <p suppressHydrationWarning className="text-4xl text-[#5d4037] mb-10 leading-snug">
                    {t.shareDrawer.storyPromptLine1(targetYear)}
                    <br />
                    {t.shareDrawer.storyPromptLine2}
                  </p>

                  <div className="bg-[#3e2723] text-[#f4e4bc] text-5xl py-8 px-12 inline-block font-bold mb-10 border-[8px] border-[#2b1b17] shadow-[10px_10px_0_#2b1b17]">
                    {username}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <img
                      src="/pixel/gift_box.png"
                      alt=""
                      width={48}
                      height={48}
                      style={{ imageRendering: "pixelated" }}
                    />
                    <p className="text-3xl text-[#b91c1c] font-bold tracking-widest uppercase">
                      {t.shareDrawer.storyBadge}
                    </p>
                    <img
                      src="/pixel/envelope_sealed.png"
                      alt=""
                      width={60}
                      height={42}
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                </div>

                <div className="absolute bottom-28 text-center">
                  <p className="text-[#f4e4bc] text-3xl flex items-center justify-center gap-3">
                    <span>{t.shareDrawer.storyFooter}</span>
                    <Link2 size={30} />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
