"use client";

import { useState } from "react";
import SnowEffect from "@/components/SnowEffect";
import PixelSprite from "@/components/PixelSprite";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Info, Share2 } from "lucide-react";
import ShareDrawer from "@/components/ShareDrawer";
import CalendarReminder from "@/components/CalendarReminder";
import WarningPopup from "@/components/WarningPopup";
import { useI18n } from "@/lib/i18n/context";

export default function CreateBox() {
  const { t } = useI18n();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    pin: "",
    showWrongGuess: false,
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessDrawer, setShowSuccessDrawer] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const handleCreate = async () => {
    if (!formData.fullName.trim() || !formData.username.trim() || formData.pin.length < 4) {
      setWarningMessage(t.create.errors.invalidInput);
      return;
    }

    if (/\s/.test(formData.username.trim())) {
      setWarningMessage(t.create.warningNoSpaces);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username.trim(),
          pin: formData.pin,
          showWrongGuess: formData.showWrongGuess,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMap: Record<string, string> = {
          full_name_invalid: t.create.errors.fullNameInvalid,
          username_has_spaces: t.create.warningNoSpaces,
          username_invalid: t.create.errors.usernameInvalid,
          username_reserved: t.create.errors.usernameReserved,
          username_taken: t.create.errors.usernameTaken,
          pin_invalid: t.create.errors.pinInvalid,
        };
        setWarningMessage(errorMap[data.error] ?? t.create.errors.genericError);
        setLoading(false);
        return;
      }

      const finalUsername: string = data.user.username;
      const link = `${window.location.origin}/${finalUsername}`;
      setCreatedUsername(finalUsername);
      setCreatedLink(link);
      setShowSuccessDrawer(true);
      setLoading(false);

      navigator.clipboard
        .writeText(link)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          setCopied(false);
        });
    } catch (err) {
      console.error("Create error:", err);
      setWarningMessage(t.create.errors.genericError);
      setLoading(false);
    }
  };

  const handleManualCopy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const goToBox = () => {
    router.push(`/dashboard/${encodeURIComponent(createdUsername)}`);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-y-auto bg-background">
      <SnowEffect />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md pixel-panel p-6 sm:p-8 relative"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <PixelSprite name="gift_box" width={36} height={36} />
          <h1 className="font-cinzel text-2xl sm:text-3xl text-[#2b1b17] font-bold">
            {t.create.title}
          </h1>
          <PixelSprite name="holly" width={28} height={21} />
        </div>
        <p className="text-center font-merriweather text-[#5d4037] text-sm mb-6">
          {t.create.subtitle}
        </p>

        <div className="space-y-5">
          <div>
            <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">{t.create.fullNameLabel}</label>
            <input
              type="text"
              placeholder={t.create.fullNamePlaceholder}
              maxLength={60}
              className="w-full pixel-inset p-2.5 outline-none text-[#2b1b17] font-merriweather focus:border-[#b91c1c] transition-colors placeholder-[#8b7355]/60"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">{t.create.usernameLabel}</label>
            <input
              type="text"
              placeholder={t.create.usernamePlaceholder}
              maxLength={24}
              className="w-full pixel-inset p-2.5 outline-none text-[#2b1b17] font-merriweather focus:border-[#b91c1c] transition-colors placeholder-[#8b7355]/60"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">{t.create.pinLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="****"
              className="w-full pixel-inset p-2.5 outline-none text-[#2b1b17] font-merriweather tracking-[1em] text-center font-bold focus:border-[#b91c1c] transition-colors placeholder-[#8b7355]/50"
              style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, "") })}
            />
          </div>

          <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer select-none pixel-inset p-3">
            <span className="font-merriweather text-xs text-[#2b1b17]">
              {t.create.showWrongGuessLabel}
            </span>
            <input
              type="checkbox"
              checked={formData.showWrongGuess}
              onChange={(e) => setFormData({ ...formData, showWrongGuess: e.target.checked })}
              className="w-4 h-4 accent-[#b91c1c] shrink-0"
            />
          </label>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3.5 pixel-btn pixel-btn-red font-cinzel font-bold tracking-wider disabled:opacity-50 mt-2"
          >
            {loading ? t.create.creating : t.create.createButton}
          </button>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-[#5d4037] text-xs hover:text-[#2b1b17] font-cinzel font-bold">
            ← {t.create.backHome}
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSuccessDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/65 z-40 backdrop-blur-sm"
              onClick={() => setShowSuccessDrawer(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 pixel-panel p-6 max-w-lg mx-auto"
            >
              <div className="w-12 h-1.5 bg-[#8b7355]/40 mx-auto mb-5"></div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <PixelSprite name="gift_box" width={44} height={44} />
                  <PixelSprite name="santa_cat" width={48} height={48} />
                </div>

                <h2 className="font-cinzel text-2xl text-[#2b1b17] font-bold">{t.create.success.title}</h2>
                <p className="font-merriweather text-[#5d4037] text-sm">
                  {t.create.success.descriptionLine1}<br />
                  {t.create.success.descriptionLine2}
                </p>

                <div
                  onClick={handleManualCopy}
                  className="pixel-inset p-3 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <span className="font-mono text-xs text-[#2b1b17] truncate">{createdLink}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-cinzel font-bold text-[#b91c1c] shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? t.create.success.copied : t.create.success.copyLink}
                  </span>
                </div>

                <div className="pixel-inset p-2.5 text-left text-xs font-merriweather text-[#2b1b17]">
                  <p className="flex items-center gap-2">
                    <Info size={14} className="shrink-0 text-[#b91c1c]" />
                    <span>{t.create.success.minFourNotice}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowShareDrawer(true)}
                    className="w-full py-3 pixel-btn pixel-btn-red font-cinzel font-bold flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    {t.create.success.shareInvite}
                  </button>

                  <button
                    onClick={goToBox}
                    className="w-full py-3 pixel-btn pixel-btn-wood font-cinzel font-bold"
                  >
                    {t.create.success.goToBox}
                  </button>

                  <div className="pt-1">
                    <CalendarReminder />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ShareDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        username={createdUsername || formData.username}
      />

      <WarningPopup
        isOpen={Boolean(warningMessage)}
        onClose={() => setWarningMessage("")}
        title={t.create.warningTitle}
        message={warningMessage}
      />
    </main>
  );
}
