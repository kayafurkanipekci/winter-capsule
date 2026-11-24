"use client";

import { useState } from "react";
import SnowEffect from "@/components/SnowEffect";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Share2, Info } from "lucide-react";
import ShareDrawer from "@/components/ShareDrawer";
import CalendarReminder from "@/components/CalendarReminder";
import WarningPopup from "@/components/WarningPopup";
import { useI18n } from "@/lib/i18n/context";

export default function CreateBox() {
  const { t } = useI18n();
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", username: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccessDrawer, setShowSuccessDrawer] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");
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
      setShowSuccessDrawer(true);
      setLoading(false);

      navigator.clipboard.writeText(link).catch((err) => {
        console.error("Copy failed:", err);
      });
    } catch (err) {
      console.error("Create error:", err);
      setWarningMessage(t.create.errors.genericError);
      setLoading(false);
    }
  };

  const goToBox = () => {
    router.push(`/dashboard/${encodeURIComponent(createdUsername)}`);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-y-auto bg-background">
      <SnowEffect />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#f4e4bc] p-8 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8b0000] to-transparent opacity-50"></div>

        <h1 className="font-cinzel text-3xl text-[#3e2723] text-center mb-2 font-bold">
          {t.create.title}
        </h1>
        <p className="text-center font-merriweather text-[#5d4037] text-sm mb-8 italic">
          {t.create.subtitle}
        </p>

        <div className="space-y-6">
          <div>
            <label className="block font-cinzel text-[#3e2723] text-sm mb-1">{t.create.fullNameLabel}</label>
            <input
              type="text"
              placeholder={t.create.fullNamePlaceholder}
              maxLength={60}
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 outline-none text-[#3e2723] font-merriweather focus:border-[#8b0000] transition-colors placeholder-[#8b7355]/50"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-cinzel text-[#3e2723] text-sm mb-1">{t.create.usernameLabel}</label>
            <input
              type="text"
              placeholder={t.create.usernamePlaceholder}
              maxLength={24}
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 outline-none text-[#3e2723] font-merriweather focus:border-[#8b0000] transition-colors placeholder-[#8b7355]/50"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-cinzel text-[#3e2723] text-sm mb-1">{t.create.pinLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="****"
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 outline-none text-[#3e2723] font-merriweather tracking-[1em] text-center focus:border-[#8b0000] transition-colors placeholder-[#8b7355]/50"
              style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, "") })}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold tracking-wider rounded shadow hover:bg-[#5d4037] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? t.create.creating : t.create.createButton}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-[#8b7355] text-xs hover:text-[#5d4037] font-cinzel">
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
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowSuccessDrawer(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000]"
            >
              <div className="w-12 h-1 bg-[#8b7355]/30 rounded-full mx-auto mb-6"></div>

              <div className="text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                  <Check size={32} />
                </div>

                <h2 className="font-cinzel text-2xl text-[#3e2723] font-bold">{t.create.success.title}</h2>
                <p className="font-merriweather text-[#5d4037] text-sm">
                  {t.create.success.descriptionLine1}<br />
                  {t.create.success.descriptionLine2}
                </p>

                <div className="bg-[#e6d5aa]/60 border border-[#8b7355]/30 rounded-lg p-3 text-left space-y-1.5 text-xs font-merriweather text-[#3e2723]">
                  <p className="flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5 text-[#8b0000]" />
                    <span>{t.create.success.rememberedNotice}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5 text-[#8b0000]" />
                    <span>{t.create.success.minFourNotice}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowShareDrawer(true)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-cinzel font-bold rounded shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} />
                    {t.create.success.shareInvite}
                  </button>

                  <button
                    onClick={goToBox}
                    className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded shadow hover:bg-[#5d4037] transition-all"
                  >
                    {t.create.success.goToBox}
                  </button>

                  <div className="mt-2">
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
