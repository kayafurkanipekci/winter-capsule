"use client";

import { useState, useEffect, use } from "react";
import SnowEffect from "@/components/SnowEffect";
import PixelSprite from "@/components/PixelSprite";
import WarningPopup from "@/components/WarningPopup";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Camera,
  Lock,
  PenLine,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { compressImageToJpeg } from "@/lib/image/compress";

interface BoxInfoResponse {
  box: { username: string; fullName: string };
  season: number;
  acceptingCards: boolean;
  isOwner: boolean;
  alreadySubmitted: boolean;
  viewer: { id: string; username: string; fullName: string } | null;
}

type ViewState =
  | "loading"
  | "not_found"
  | "is_owner"
  | "box_closed"
  | "already_submitted"
  | "intro"
  | "auth"
  | "clues"
  | "note"
  | "preview"
  | "sealing"
  | "success";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UserPage({ params }: PageProps) {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const resolvedParams = use(params);
  const routeUsername = decodeURIComponent(resolvedParams.username);

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [boxInfo, setBoxInfo] = useState<BoxInfoResponse | null>(null);

  const [authTab, setAuthTab] = useState<"register" | "login">("register");
  const [authFullName, setAuthFullName] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [clueText, setClueText] = useState("");
  const [extraTextClues, setExtraTextClues] = useState<string[]>([]);
  const [cluePhoto, setCluePhoto] = useState<File | null>(null);
  const [cluePhotoPreview, setCluePhotoPreview] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [notePhoto, setNotePhoto] = useState<File | null>(null);
  const [notePhotoPreview, setNotePhotoPreview] = useState<string | null>(null);
  const [compressingField, setCompressingField] = useState<"clue" | "note" | null>(null);

  const [sealStage, setSealStage] = useState<"folding" | "sealed" | "flying">("folding");
  const [submitting, setSubmitting] = useState(false);
  const [submittedAsAnon, setSubmittedAsAnon] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/box/${encodeURIComponent(routeUsername)}`)
      .then(async (res) => {
        if (res.status === 404) return null;
        return res.json();
      })
      .then((data: BoxInfoResponse | null) => {
        if (cancelled) return;
        if (!data || !data.box) {
          setViewState("not_found");
          return;
        }
        setBoxInfo(data);
        if (data.viewer) {
          setAuthorName(data.viewer.fullName);
        }
        if (data.isOwner) {
          setViewState("is_owner");
        } else if (!data.acceptingCards) {
          setViewState("box_closed");
        } else if (data.alreadySubmitted) {
          setViewState("already_submitted");
        } else {
          setViewState("intro");
        }
      })
      .catch(() => {
        if (!cancelled) setViewState("not_found");
      });

    return () => {
      cancelled = true;
    };
  }, [routeUsername]);

  useEffect(() => {
    return () => {
      if (cluePhotoPreview) URL.revokeObjectURL(cluePhotoPreview);
      if (notePhotoPreview) URL.revokeObjectURL(notePhotoPreview);
    };
  }, [cluePhotoPreview, notePhotoPreview]);

  const extraClueCount = extraTextClues.length + (cluePhoto ? 1 : 0);

  const handlePhotoSelect = async (target: "clue" | "note", file: File | undefined) => {
    if (!file) return;
    if (target === "clue" && !cluePhoto && extraClueCount >= 2) return;

    setCompressingField(target);
    try {
      const compressed = await compressImageToJpeg(file);
      const previewUrl = URL.createObjectURL(compressed);
      if (target === "clue") {
        if (cluePhotoPreview) URL.revokeObjectURL(cluePhotoPreview);
        setCluePhoto(compressed);
        setCluePhotoPreview(previewUrl);
      } else {
        if (notePhotoPreview) URL.revokeObjectURL(notePhotoPreview);
        setNotePhoto(compressed);
        setNotePhotoPreview(previewUrl);
      }
    } catch (err) {
      console.error("Image compression error:", err);
      setWarningMessage(t.userPage.errors.invalidImage);
    } finally {
      setCompressingField(null);
    }
  };

  const clearPhoto = (target: "clue" | "note") => {
    if (target === "clue") {
      if (cluePhotoPreview) URL.revokeObjectURL(cluePhotoPreview);
      setCluePhoto(null);
      setCluePhotoPreview(null);
    } else {
      if (notePhotoPreview) URL.revokeObjectURL(notePhotoPreview);
      setNotePhoto(null);
      setNotePhotoPreview(null);
    }
  };

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);

    try {
      const endpoint = authTab === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        authTab === "register"
          ? { fullName: authFullName, username: authUsername.trim(), pin: authPin }
          : { username: authUsername.trim(), pin: authPin };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          user_not_found: t.login.notFound.title,
          wrong_pin: t.login.wrongPin,
        };
        setWarningMessage(errorMap[data.error] ?? t.create.errors.genericError);
        setAuthLoading(false);
        return;
      }

      const boxRes = await fetch(`/api/box/${encodeURIComponent(routeUsername)}`);
      const updatedBox: BoxInfoResponse | null = boxRes.ok ? await boxRes.json() : null;
      if (updatedBox) {
        setBoxInfo(updatedBox);
        if (updatedBox.viewer) {
          setAuthorName(updatedBox.viewer.fullName);
        }
        if (updatedBox.isOwner) {
          setViewState("is_owner");
        } else if (updatedBox.alreadySubmitted) {
          setViewState("already_submitted");
        } else {
          setViewState("clues");
        }
      } else {
        setAuthorName(data.user.fullName);
        setViewState("clues");
      }
    } catch (err) {
      console.error("Inline auth error:", err);
      setWarningMessage(t.create.errors.genericError);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleNextToNote = () => {
    const trimmedName = authorName.trim().replace(/\s+/g, " ");
    if (!boxInfo?.viewer) {
      const words = trimmedName.split(" ").filter(Boolean);
      if (words.length < 2 || trimmedName.length > 60) {
        setWarningMessage(t.userPage.errors.fullNameInvalid);
        return;
      }
    }

    const trimmedClue = clueText.trim();
    if (trimmedClue.length < 3 || trimmedClue.length > 300) {
      setWarningMessage(t.userPage.errors.clueInvalid);
      return;
    }

    setViewState("note");
  };

  const handleConfirmSend = async () => {
    if (!boxInfo || submitting) return;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.set("boxUsername", boxInfo.box.username);
      if (!boxInfo.viewer) {
        fd.set("authorName", authorName.trim());
      }
      fd.set("clueText", clueText.trim());
      const cleanedExtras = extraTextClues.map((c) => c.trim()).filter(Boolean);
      if (cleanedExtras[0]) fd.set("clueExtra1", cleanedExtras[0]);
      if (cleanedExtras[1]) fd.set("clueExtra2", cleanedExtras[1]);
      if (note.trim()) fd.set("note", note.trim());
      if (cluePhoto) fd.set("cluePhoto", cluePhoto);
      if (notePhoto) fd.set("notePhoto", notePhoto);

      const res = await fetch("/api/entries", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMap: Record<string, string> = {
          full_name_invalid: t.userPage.errors.fullNameInvalid,
          clue_invalid: t.userPage.errors.clueInvalid,
          name_taken: t.userPage.errors.nameTaken,
          already_submitted: t.userPage.errors.alreadySubmitted,
          box_already_opened: t.userPage.errors.boxClosed,
          cannot_send_to_self: t.userPage.errors.cannotSendToSelf,
          invalid_image: t.userPage.errors.invalidImage,
        };
        setWarningMessage(errorMap[data.error] ?? t.userPage.sendError);
        setSubmitting(false);
        return;
      }

      setSubmittedAsAnon(Boolean(data.isAnonymous));

      if (shouldReduceMotion) {
        setViewState("success");
        setSubmitting(false);
        return;
      }

      setViewState("sealing");
      setSealStage("folding");
      setTimeout(() => setSealStage("sealed"), 1200);
      setTimeout(() => setSealStage("flying"), 2100);
      setTimeout(() => {
        setViewState("success");
        setSubmitting(false);
      }, 3000);
    } catch (err) {
      console.error("Submit entry error:", err);
      setWarningMessage(t.userPage.sendError);
      setSubmitting(false);
    }
  };

  const currentDay = new Date().getDate().toString();
  const displayReceiver = boxInfo?.box.fullName ?? routeUsername;
  const cleanedExtras = extraTextClues.map((c) => c.trim()).filter(Boolean);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-y-auto bg-background">
      <SnowEffect />

      <AnimatePresence mode="wait">
        {viewState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-10 flex flex-col items-center gap-3">
            <PixelSprite name="santa_cat" width={56} height={56} className="animate-bounce" />
            <p className="font-cinzel text-[#2b1b17] dark:text-amber-300 font-bold">{t.userPage.searchingBox}</p>
          </motion.div>
        )}

        {viewState === "not_found" && (
          <motion.div
            key="not_found"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center pixel-panel p-8 max-w-md w-full space-y-4"
          >
            <PixelSprite name="snowman" width={50} height={60} className="mx-auto" />
            <h2 className="font-cinzel text-2xl text-[#2b1b17] font-bold">{t.userPage.notFoundTitle}</h2>
            <p className="font-merriweather text-[#5d4037] text-sm">
              {t.userPage.notFoundDescription(routeUsername)}
            </p>
            <p className="font-merriweather text-[#5d4037] text-xs italic">
              {t.userPage.claimPrompt}
            </p>
            <Link
              href="/create"
              className="block w-full py-3 pixel-btn pixel-btn-red font-cinzel font-bold text-sm text-center"
            >
              {t.userPage.createWithName}
            </Link>
            <Link href="/" className="block text-xs text-[#5d4037] hover:underline font-cinzel font-bold">
              {t.userPage.backHome}
            </Link>
          </motion.div>
        )}

        {(viewState === "is_owner" || viewState === "box_closed" || viewState === "already_submitted") && (
          <motion.div
            key={viewState}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center pixel-panel p-8 max-w-md w-full space-y-4"
          >
            <Lock size={36} className="mx-auto text-[#b91c1c]" />
            <h2 className="font-cinzel text-2xl text-[#2b1b17] font-bold">
              {viewState === "is_owner"
                ? t.userPage.ownerTitle
                : viewState === "box_closed"
                  ? t.userPage.boxClosedTitle
                  : t.userPage.alreadySubmittedTitle}
            </h2>
            <p className="font-merriweather text-[#5d4037] text-sm">
              {viewState === "is_owner"
                ? t.userPage.ownerDescription
                : viewState === "box_closed"
                  ? t.userPage.boxClosedDescription
                  : t.userPage.alreadySubmittedDescription}
            </p>
            {boxInfo?.viewer && (
              <Link
                href={`/dashboard/${encodeURIComponent(boxInfo.viewer.username)}`}
                className="block w-full py-3 pixel-btn pixel-btn-wood font-cinzel font-bold text-sm text-center"
              >
                {viewState === "is_owner" ? t.userPage.goToDashboard : t.userPage.goToMyBox}
              </Link>
            )}
            <Link href="/" className="block text-xs text-[#5d4037] hover:underline font-cinzel font-bold">
              {t.userPage.backHome}
            </Link>
          </motion.div>
        )}

        {viewState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 text-center space-y-6 max-w-2xl px-4 w-full"
          >
            <div className="flex items-end justify-center gap-4">
              <PixelSprite name="pine_tree" width={54} height={72} />
              <PixelSprite name="santa_cat" width={56} height={56} />
              <PixelSprite name="gift_box" width={40} height={40} />
            </div>

            <div className="pixel-panel p-6 sm:p-8 space-y-5">
              <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#2b1b17]">
                {displayReceiver}
              </h1>
              <p className="font-merriweather text-base sm:text-lg text-[#5d4037]">
                {t.userPage.introSubtitle}
              </p>

              {boxInfo?.viewer ? (
                <button
                  onClick={() => setViewState("clues")}
                  className="px-8 py-4 pixel-btn pixel-btn-red font-cinzel text-lg font-bold inline-flex items-center gap-2"
                >
                  <PixelSprite name="envelope_sealed" width={24} height={17} />
                  {t.userPage.writeLetter}
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mx-auto pt-2">
                  <button
                    onClick={() => setViewState("clues")}
                    className="w-full min-h-[56px] py-3.5 px-5 pixel-btn pixel-btn-wood font-cinzel text-sm sm:text-base font-bold flex items-center justify-center text-center"
                  >
                    {t.userPage.continueAnonymous}
                  </button>
                  <button
                    onClick={() => setViewState("auth")}
                    className="w-full min-h-[56px] py-3.5 px-5 pixel-btn pixel-btn-red font-cinzel text-sm sm:text-base font-bold flex items-center justify-center gap-2 text-center"
                  >
                    <UserPlus size={18} className="shrink-0" />
                    <span>{t.userPage.createOrLogin}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* INLINE REGISTER / LOGIN FOR INVITED GUEST */}
        {viewState === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="z-20 w-full max-w-md pixel-panel p-6 sm:p-8 space-y-5"
          >
            <div className="flex border-b-2 border-[#8b7355]/30">
              <button
                type="button"
                onClick={() => setAuthTab("register")}
                className={`flex-1 py-2 font-cinzel text-sm font-bold border-b-4 transition-colors ${
                  authTab === "register"
                    ? "border-[#b91c1c] text-[#b91c1c]"
                    : "border-transparent text-[#5d4037]"
                }`}
              >
                {t.userPage.authPanel.registerTab}
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className={`flex-1 py-2 font-cinzel text-sm font-bold border-b-4 transition-colors ${
                  authTab === "login"
                    ? "border-[#b91c1c] text-[#b91c1c]"
                    : "border-transparent text-[#5d4037]"
                }`}
              >
                {t.userPage.authPanel.loginTab}
              </button>
            </div>

            <form onSubmit={handleInlineAuth} className="space-y-4">
              {authTab === "register" && (
                <div>
                  <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">
                    {t.create.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder={t.create.fullNamePlaceholder}
                    maxLength={60}
                    required
                    className="w-full pixel-inset p-2.5 text-[#2b1b17] font-merriweather outline-none focus:border-[#b91c1c]"
                  />
                </div>
              )}

              <div>
                <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">
                  {t.create.usernameLabel}
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder={t.create.usernamePlaceholder}
                  maxLength={24}
                  required
                  className="w-full pixel-inset p-2.5 text-[#2b1b17] font-merriweather outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block font-cinzel font-bold text-[#2b1b17] text-sm mb-1">
                  {t.create.pinLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="****"
                  style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                  required
                  className="w-full pixel-inset p-2.5 text-center tracking-[1em] text-[#2b1b17] font-bold outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div className="flex items-stretch gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewState("intro")}
                  className="flex-1 min-h-[44px] py-2.5 pixel-btn pixel-btn-parchment font-cinzel font-bold text-sm flex items-center justify-center"
                >
                  {t.userPage.authPanel.back}
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 min-h-[44px] py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-sm disabled:opacity-60 flex items-center justify-center"
                >
                  {authLoading ? t.create.creating : t.userPage.authPanel.submitAndContinue}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 1: CLUES */}
        {viewState === "clues" && (
          <motion.div
            key="clues"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="z-20 w-full max-w-xl my-8"
          >
            <div className="pixel-panel p-6 md:p-8 space-y-5 relative">
              <div className="flex justify-between items-center border-b-2 border-[#8b7355]/40 pb-3">
                <div className="flex items-center gap-2">
                  <PixelSprite name="holly" width={24} height={18} />
                  <span className="text-[#2b1b17] font-cinzel text-sm font-bold tracking-wider">
                    {displayReceiver}
                  </span>
                </div>
                <PixelSprite name="santa_cat" width={28} height={28} />
              </div>

              <div>
                <label className="block font-cinzel text-[#2b1b17] text-sm font-bold mb-1">
                  {t.userPage.form.authorNameLabel}
                </label>
                <input
                  type="text"
                  value={authorName}
                  disabled={Boolean(boxInfo?.viewer)}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={60}
                  placeholder={t.userPage.form.authorNamePlaceholder}
                  className="w-full pixel-inset p-2.5 text-[#2b1b17] font-merriweather outline-none focus:border-[#b91c1c] disabled:opacity-75"
                />
                {!boxInfo?.viewer && (
                  <p className="text-[11px] text-[#5d4037] mt-1 font-merriweather">
                    {t.userPage.form.authorNameHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-cinzel text-[#2b1b17] text-sm font-bold mb-1">
                  {t.userPage.form.clueTextLabel}
                </label>
                <textarea
                  value={clueText}
                  onChange={(e) => setClueText(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder={t.userPage.form.clueTextPlaceholder}
                  className="w-full pixel-inset p-3 text-[#2b1b17] font-merriweather text-sm outline-none focus:border-[#b91c1c] resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-[#b91c1c] font-merriweather font-bold">
                    {t.userPage.form.clueTextHint}
                  </span>
                  <span className="text-[11px] text-[#5d4037] font-mono">{clueText.length}/300</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-[#8b7355]/30 space-y-3">
                <div>
                  <p className="font-cinzel text-[#2b1b17] text-sm font-bold">
                    {t.userPage.form.extraCluesTitle}
                  </p>
                  <p className="text-[11px] text-[#5d4037] font-merriweather">
                    {t.userPage.form.extraCluesHint}
                  </p>
                </div>

                {extraTextClues.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={val}
                      maxLength={extraTextClues.length > 1 ? 90 : 200}
                      onChange={(e) => {
                        const next = [...extraTextClues];
                        next[idx] = e.target.value;
                        setExtraTextClues(next);
                      }}
                      placeholder={t.userPage.form.extraCluePlaceholder}
                      className="flex-1 pixel-inset p-2.5 text-[#2b1b17] font-merriweather text-sm outline-none focus:border-[#b91c1c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExtraTextClues(extraTextClues.filter((_, i) => i !== idx))
                      }
                      className="p-2.5 pixel-btn pixel-btn-red"
                      aria-label={t.userPage.form.removeClue}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {cluePhotoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={cluePhotoPreview}
                      alt="Clue preview"
                      className="h-28 w-28 object-cover border-3 border-[#2b1b17]"
                    />
                    <button
                      type="button"
                      onClick={() => clearPhoto("clue")}
                      className="absolute -top-2 -right-2 bg-[#b91c1c] text-white border-2 border-[#2b1b17] p-1"
                      aria-label={t.userPage.form.removeClue}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {extraClueCount < 2 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setExtraTextClues([...extraTextClues, ""])}
                      className="inline-flex items-center gap-1.5 px-3 py-2 pixel-btn pixel-btn-parchment text-xs font-cinzel font-bold"
                    >
                      <Plus size={14} />
                      {t.userPage.form.addTextClue}
                    </button>

                    {!cluePhoto && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 pixel-btn pixel-btn-parchment cursor-pointer text-xs font-cinzel font-bold">
                        <Camera size={14} />
                        <span>
                          {compressingField === "clue"
                            ? t.userPage.form.compressing
                            : t.userPage.form.addPhotoClue}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={compressingField !== null}
                          onChange={(e) => handlePhotoSelect("clue", e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-stretch justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setViewState("intro")}
                  className="px-4 py-2.5 pixel-btn pixel-btn-parchment font-cinzel text-sm font-bold"
                >
                  {t.userPage.form.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleNextToNote}
                  disabled={compressingField !== null}
                  className="px-6 py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-sm disabled:opacity-50"
                >
                  {t.userPage.form.nextToNote}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: REAL PIXEL-ART LETTER SCREEN */}
        {viewState === "note" && (
          <motion.div
            key="note"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="z-20 w-full max-w-lg my-8"
          >
            <div className="pixel-panel p-6 sm:p-8 relative space-y-4">
              {/* Top Letter Header */}
              <div className="flex justify-between items-center border-b-3 border-[#2b1b17] pb-3">
                <div className="flex items-center gap-2">
                  <PixelSprite name="envelope_sealed" width={28} height={20} />
                  <span className="text-[#2b1b17] font-cinzel text-sm font-bold tracking-wider">
                    {t.userPage.noteStep.title}
                  </span>
                </div>
                <PixelSprite name="holly" width={24} height={18} />
              </div>

              <p className="font-merriweather text-xs text-[#5d4037]">
                {t.userPage.noteStep.subtitle}
              </p>

              {/* Ruled Pixel-Art Parchment Sheet with Wax Seal */}
              <div className="relative bg-[#fff9e6] border-3 border-[#2b1b17] shadow-[inset_3px_3px_0_rgba(43,27,23,0.1)] p-4 pb-12">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  placeholder={t.userPage.noteStep.placeholder}
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(transparent, transparent 29px, rgba(139, 115, 85, 0.25) 30px)",
                    lineHeight: "30px",
                  }}
                  className="w-full h-56 bg-transparent resize-none outline-none text-[#2b1b17] font-hand text-lg placeholder-[#8b7355]/60"
                  autoFocus
                />

                {/* Pixel Wax Seal Stamp */}
                <div className="absolute bottom-3 right-3 w-11 h-11 bg-[#b91c1c] border-3 border-[#2b1b17] shadow-[2px_2px_0_#2b1b17] flex items-center justify-center">
                  <span className="text-[#fffdf7] font-cinzel font-bold text-sm">{currentDay}</span>
                </div>
              </div>

              <div className="pt-1">
                <p className="font-cinzel font-bold text-xs text-[#5d4037] mb-2">
                  {t.userPage.noteStep.photoLabel}
                </p>
                {notePhotoPreview ? (
                  <div className="relative inline-block bg-[#fffdf7] p-1.5 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17]">
                    <img
                      src={notePhotoPreview}
                      alt="Note preview"
                      className="h-24 w-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => clearPhoto("note")}
                      className="absolute -top-2 -right-2 bg-[#b91c1c] text-white border-2 border-[#2b1b17] p-1"
                      aria-label={t.userPage.noteStep.removePhoto}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-3 py-2 pixel-btn pixel-btn-parchment cursor-pointer text-xs font-cinzel font-bold">
                    <Camera size={14} />
                    <span>
                      {compressingField === "note"
                        ? t.userPage.form.compressing
                        : t.userPage.noteStep.selectPhoto}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={compressingField !== null}
                      onChange={(e) => handlePhotoSelect("note", e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-stretch justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewState("clues")}
                  className="px-4 py-2.5 pixel-btn pixel-btn-parchment font-cinzel text-xs font-bold"
                >
                  ← {t.userPage.noteStep.backToClues}
                </button>

                <button
                  type="button"
                  disabled={compressingField !== null}
                  onClick={() => setViewState("preview")}
                  className="px-6 py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-sm disabled:opacity-50"
                >
                  {note.trim() || notePhoto
                    ? t.userPage.noteStep.previewButton
                    : t.userPage.noteStep.skipToPreview}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PREVIEW (CLUES CARD & LETTER SEPARATED) */}
        {viewState === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="z-20 w-full max-w-lg my-8 pixel-panel p-6 md:p-8 space-y-5"
          >
            <div className="flex items-center justify-center gap-2 border-b-2 border-[#8b7355]/40 pb-3">
              <PixelSprite name="gift_box" width={28} height={28} />
              <h2 className="font-cinzel text-2xl font-bold text-[#2b1b17]">
                {t.userPage.preview.title}
              </h2>
            </div>

            {/* Section 1: Who Am I? Clues Card */}
            <div className="bg-[#e6d5aa] border-3 border-[#2b1b17] shadow-[4px_4px_0_#2b1b17] p-4 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#8b7355]/40 pb-2">
                <div className="flex items-center gap-2">
                  <PixelSprite name="santa_cat" width={24} height={24} />
                  <span className="font-cinzel text-xs font-bold uppercase text-[#b91c1c]">
                    {t.game.results.cluesLabel}
                  </span>
                </div>
                <span className="bg-[#3e2723] text-[#f4e4bc] px-2.5 py-0.5 text-xs font-cinzel font-bold">
                  {authorName.trim()}
                </span>
              </div>

              <div className="bg-[#fff9e6] border-2 border-[#5d4037] p-3 text-sm font-merriweather text-[#2b1b17]">
                "{clueText.trim()}"
              </div>

              {cleanedExtras.map((extra, idx) => (
                <div
                  key={idx}
                  className="bg-[#fff9e6] border-2 border-[#5d4037] p-2.5 text-xs font-merriweather text-[#5d4037]"
                >
                  + {extra}
                </div>
              ))}

              {cluePhotoPreview && (
                <img
                  src={cluePhotoPreview}
                  alt="Clue"
                  className="h-32 w-32 object-cover border-3 border-[#2b1b17]"
                />
              )}
            </div>

            {/* Section 2: Pixel-Art Letter (Separate from Clues) */}
            {(note.trim() || notePhotoPreview) && (
              <div className="relative bg-[#fff9e6] border-3 border-[#2b1b17] shadow-[4px_4px_0_#2b1b17] p-4 pb-10 space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#8b7355]/30 pb-2">
                  <div className="flex items-center gap-2">
                    <PixelSprite name="envelope_sealed" width={24} height={17} />
                    <span className="font-cinzel text-xs font-bold uppercase text-[#1b4332]">
                      {t.game.results.noteLabel}
                    </span>
                  </div>
                  <PixelSprite name="holly" width={20} height={15} />
                </div>

                {note.trim() && (
                  <p
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 27px, rgba(139, 115, 85, 0.22) 28px)",
                      lineHeight: "28px",
                    }}
                    className="font-hand text-base text-[#2b1b17] whitespace-pre-wrap"
                  >
                    {note.trim()}
                  </p>
                )}

                {notePhotoPreview && (
                  <div className="inline-block bg-[#fffdf7] p-1.5 border-2 border-[#2b1b17]">
                    <img
                      src={notePhotoPreview}
                      alt="Note"
                      className="h-24 w-24 object-cover"
                    />
                  </div>
                )}

                <div className="absolute bottom-2.5 right-2.5 w-9 h-9 bg-[#b91c1c] border-2 border-[#2b1b17] flex items-center justify-center">
                  <span className="text-[#fffdf7] font-cinzel font-bold text-xs">{currentDay}</span>
                </div>
              </div>
            )}

            <div className="flex items-stretch gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setViewState("clues")}
                className="flex-1 min-h-[48px] py-3 pixel-btn pixel-btn-parchment font-cinzel font-bold flex items-center justify-center"
              >
                {t.userPage.preview.backToEdit}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSend}
                className="flex-1 min-h-[48px] py-3 pixel-btn pixel-btn-red font-cinzel font-bold disabled:opacity-60 flex items-center justify-center"
              >
                {submitting ? t.userPage.preview.sending : t.userPage.preview.sealAndSend}
              </button>
            </div>
          </motion.div>
        )}

        {viewState === "sealing" && (
          <motion.div
            key="sealing"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
              sealStage === "flying"
                ? { y: -800, opacity: 0, rotate: 10 }
                : { scale: 1, opacity: 1, y: 0 }
            }
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="relative w-80 h-48 bg-[#f4e4bc] border-4 border-[#2b1b17] shadow-[6px_6px_0_#2b1b17] flex items-center justify-center z-50"
          >
            <div className="absolute inset-0 border-[10px] border-[#e6d5aa] border-t-0 border-l-[156px] border-r-[156px] border-b-[92px] border-l-transparent border-r-transparent border-t-transparent"></div>
            <motion.div
              initial={{ rotateX: 180, transformOrigin: "top" }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="absolute top-0 left-0 w-full h-full border-t-[92px] border-l-[156px] border-r-[156px] border-[#d4c39b] border-l-transparent border-r-transparent border-b-transparent z-10"
            />
            {sealStage !== "folding" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="absolute z-20 w-16 h-16 bg-[#b91c1c] shadow-[3px_3px_0_#2b1b17] flex items-center justify-center border-4 border-[#2b1b17]"
              >
                <span className="text-[#fffdf7] font-cinzel font-bold text-2xl">{currentDay}</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center pixel-panel p-8 max-w-md w-full space-y-5"
          >
            <div className="flex items-center justify-center gap-3">
              <PixelSprite name="gift_box" width={44} height={44} />
              <PixelSprite name="santa_cat" width={48} height={48} />
            </div>

            <h2 className="font-cinzel text-2xl text-[#2b1b17] font-bold">
              {t.userPage.successTitle(displayReceiver)}
            </h2>

            {submittedAsAnon ? (
              <div className="pixel-inset p-4 space-y-3 text-left">
                <p className="font-cinzel font-bold text-sm text-[#2b1b17]">
                  {t.userPage.anonymousTitle}
                </p>
                <p className="font-merriweather text-xs text-[#5d4037]">
                  {t.userPage.anonymousHint}
                </p>
                <div className="flex flex-col gap-2.5 pt-1">
                  <Link
                    href="/create"
                    className="w-full py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-sm text-center"
                  >
                    {t.userPage.createAccount}
                  </Link>
                  <Link
                    href="/login"
                    className="w-full py-2.5 pixel-btn pixel-btn-wood font-cinzel font-bold text-sm text-center"
                  >
                    {t.userPage.loginAccount}
                  </Link>
                </div>
                <p className="text-[11px] text-[#5d4037] font-merriweather text-center">
                  {t.userPage.stayAnonymousNote}
                </p>
              </div>
            ) : (
              boxInfo?.viewer && (
                <Link
                  href={`/dashboard/${encodeURIComponent(boxInfo.viewer.username)}`}
                  className="block w-full py-3 pixel-btn pixel-btn-wood font-cinzel font-bold text-center"
                >
                  {t.userPage.goToMyBox}
                </Link>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <WarningPopup
        isOpen={Boolean(warningMessage)}
        onClose={() => setWarningMessage("")}
        title={t.create.warningTitle}
        message={warningMessage}
      />
    </main>
  );
}
