"use client";

import { useEffect, useLayoutEffect, useState, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import SnowEffect from "@/components/SnowEffect";
import PixelSprite from "@/components/PixelSprite";
import PixelAvatar from "@/components/avatar/PixelAvatar";
import PixelRulesModal from "@/components/PixelRulesModal";
import { generateRandomAvatar } from "@/lib/avatar";
import {
  Check,
  Download,
  HelpCircle,
  Paperclip,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { normalizeName } from "@/lib/normalize";

interface RevealedClue {
  type: "text" | "extra" | "extra2" | "photo";
  value: string;
}

interface ActiveGameState {
  mode: "game";
  status: "in_progress";
  answeredCount: number;
  totalCount: number;
  card: {
    id: string;
    position: number;
    revealedClues: RevealedClue[];
    revealedCount: number;
    totalClues: number;
  };
  availableNames: Array<{ nameKey: string; fullName: string }>;
}

interface ResultCard {
  id: string;
  authorName: string;
  clueText: string;
  clueExtra: string | null;
  clueExtraList?: string[];
  cluePhotoUrl: string | null;
  note: string | null;
  notePhotoUrl: string | null;
  guessedName?: string | null;
  outcome?: "correct" | "wrong" | "passed";
  points?: number;
  revealedCount?: number;
}

interface ResultsState {
  mode: "game" | "classic";
  season: number;
  totalPoints?: number;
  maxPoints?: number;
  percent?: number;
  shareInCircle?: boolean;
  cards: ResultCard[];
}

interface CircleEntry {
  fullName: string;
  avatarId?: string | null;
  percent: number;
  isSelf: boolean;
}

interface PageProps {
  params: Promise<{ username: string; season: string }>;
}

export default function GamePage({ params }: PageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const resolved = use(params);
  const username = decodeURIComponent(resolved.username);
  const season = Number(resolved.season);

  const [loading, setLoading] = useState(true);
  const [cachedAvatar, setCachedAvatar] = useState<string | null | undefined>(undefined);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(`kapsul_avatar_${normalizeName(username)}`);
      setCachedAvatar(stored ?? null);
    } catch {
      setCachedAvatar(null);
    }
  }, [username]);
  const [gameState, setGameState] = useState<ActiveGameState | null>(null);
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "guess"; nameKey: string; fullName: string }
    | { type: "pass" }
    | null
  >(null);
  const [polaroidUrl, setPolaroidUrl] = useState<string | null>(null);
  const [circleEntries, setCircleEntries] = useState<CircleEntry[]>([]);
  const [togglingShare, setTogglingShare] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const resultStoryRef = useRef<HTMLDivElement>(null);
  const rulesShownRef = useRef(false);

  const loadCircle = useCallback(async () => {
    const res = await fetch(`/api/circle/${season}`);
    if (res.ok) {
      const data = await res.json();
      setCircleEntries(data.entries ?? []);
    }
  }, [season]);

  const loadResults = useCallback(async () => {
    const res = await fetch(`/api/game/${season}/results`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.ok) {
      const data: ResultsState = await res.json();
      setResultsState(data);
      setGameState(null);
      if (data.mode === "game") {
        await loadCircle();
      }
    }
  }, [season, router, loadCircle]);

  const loadGameState = useCallback(async () => {
    const res = await fetch(`/api/game/${season}`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    if (data.mode === "classic" || data.status === "finished") {
      await loadResults();
    } else if (data.card) {
      setGameState(data);
      if (!rulesShownRef.current && data.answeredCount === 0 && data.card.revealedCount === 1) {
        rulesShownRef.current = true;
        setShowRulesModal(true);
      }
    }
  }, [season, router, loadResults]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const openRes = await fetch("/api/game/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ season }),
        });

        if (openRes.status === 401) {
          router.replace("/login");
          return;
        }
        if (openRes.status === 403) {
          router.replace(`/dashboard/${encodeURIComponent(username)}`);
          return;
        }

        const openData = await openRes.json();
        if (cancelled) return;

        if (openData.mode === "classic" || openData.status === "finished") {
          await loadResults();
        } else {
          await loadGameState();
        }
      } catch (err) {
        console.error("Init game error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [season, username, router, loadGameState, loadResults]);

  const handleRevealHint = async () => {
    if (!gameState || revealing) return;
    setRevealing(true);
    try {
      const res = await fetch(`/api/game/${season}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: gameState.card.id }),
      });
      if (res.ok) {
        await loadGameState();
      }
    } finally {
      setRevealing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!gameState || !pendingAction || submitting) return;
    setSubmitting(true);
    try {
      const body =
        pendingAction.type === "pass"
          ? { cardId: gameState.card.id, action: "pass" }
          : { cardId: gameState.card.id, action: "guess", nameKey: pendingAction.nameKey };

      const res = await fetch(`/api/game/${season}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setPendingAction(null);
      if (res.ok) {
        const data = await res.json();
        if (data.finished) {
          await loadResults();
        } else {
          await loadGameState();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCircleShare = async (checked: boolean) => {
    if (!resultsState || togglingShare) return;
    setTogglingShare(true);
    try {
      const res = await fetch(`/api/game/${season}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareInCircle: checked }),
      });
      if (res.ok) {
        const data = await res.json();
        setResultsState((prev) =>
          prev ? { ...prev, shareInCircle: data.shareInCircle } : prev
        );
        await loadCircle();
      }
    } finally {
      setTogglingShare(false);
    }
  };

  const handleShareResultImage = async () => {
    if (!resultStoryRef.current || sharingImage) return;
    setSharingImage(true);
    try {
      const dataUrl = await toPng(resultStoryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], t.game.results.resultStoryFilename, {
        type: "image/png",
      });

      if (navigator.share) {
        await navigator.share({
          title: t.game.results.title,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = t.game.results.resultStoryFilename;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Result image share error:", err);
    } finally {
      setSharingImage(false);
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-3">
        <SnowEffect />
        {cachedAvatar !== undefined ? (
          <PixelAvatar
            config={cachedAvatar ?? generateRandomAvatar(username)}
            size={64}
            className="z-10 animate-bounce"
          />
        ) : (
          <div className="w-16 h-16 z-10" />
        )}
        <p className="z-10 font-cinzel text-[#2b1b17] dark:text-amber-300 font-bold">
          {t.game.loading}
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background overflow-y-auto custom-scrollbar flex flex-col items-center p-4 pb-16">
      <SnowEffect />

      <div className="w-full max-w-5xl flex items-center justify-between pt-2 z-20">
        <Link
          href={`/dashboard/${encodeURIComponent(username)}`}
          className="px-3 py-1.5 pixel-btn pixel-btn-parchment font-cinzel text-xs font-bold"
        >
          ← {t.game.backToDashboard}
        </Link>
      </div>

      {/* ACTIVE GAME SCREEN */}
      {gameState && (
        <div className="z-10 w-full max-w-5xl mt-6 space-y-6">
          {/* Pixel Progress Bar */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex justify-between text-xs font-cinzel font-bold text-[#2b1b17] dark:text-amber-200">
              <span>{t.dashboard.seasonTitle(season)}</span>
              <span>{t.game.progress(gameState.answeredCount, gameState.totalCount)}</span>
            </div>
            <div className="w-full h-4 bg-[#e6d5aa] dark:bg-zinc-900 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17]">
              <div
                className="h-full bg-[#b91c1c] transition-all duration-300"
                style={{
                  width: `${(gameState.answeredCount / Math.max(1, gameState.totalCount)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Clue Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState.card.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: -18, scale: 0.96 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: 18, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="pixel-panel p-6 md:p-8 space-y-5"
                >
                  <div className="flex items-center justify-between border-b-2 border-[#8b7355]/40 pb-3">
                    <div className="flex items-center gap-2">
                      <PixelAvatar
                        config={cachedAvatar ?? generateRandomAvatar(username)}
                        size={32}
                      />
                      <span className="font-cinzel text-base font-bold tracking-wider text-[#b91c1c]">
                        {t.game.whoAmI}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-[#5d4037] hover:text-[#2b1b17]"
                      aria-label={t.game.rulesModal.title}
                    >
                      <HelpCircle size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {gameState.card.revealedClues.map((clue, idx) => (
                      <motion.div
                        key={`${clue.type}-${idx}`}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pixel-inset p-4"
                      >
                        {clue.type === "photo" ? (
                          <img
                            src={clue.value}
                            alt="Clue"
                            onClick={() => setPolaroidUrl(clue.value)}
                            className="max-h-72 mx-auto border-3 border-[#2b1b17] object-contain cursor-zoom-in hover:scale-[1.02] transition-transform"
                          />
                        ) : (
                          <p className="font-merriweather text-[#2b1b17] text-base leading-relaxed">
                            "{clue.value}"
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {gameState.card.revealedCount < gameState.card.totalClues ? (
                      <button
                        type="button"
                        disabled={revealing}
                        onClick={handleRevealHint}
                        className="inline-flex items-center gap-2 px-4 py-2 pixel-btn pixel-btn-green font-cinzel text-sm font-bold disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                        {t.game.revealClue}
                      </button>
                    ) : (
                      <span className="text-xs font-merriweather text-[#5d4037]">
                        {t.game.noMoreClues}
                      </span>
                    )}

                    <span className="text-xs font-cinzel font-bold text-[#5d4037]">
                      {t.game.cluesRemaining(
                        gameState.card.totalClues - gameState.card.revealedCount
                      )}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right / Bottom: Name List & Pass */}
            <div className="lg:col-span-5 pixel-panel p-6 space-y-4">
              <div className="flex items-center gap-2">
                <PixelSprite name="holly" width={24} height={18} />
                <h2 className="font-cinzel text-lg font-bold text-[#2b1b17]">
                  {t.game.namesTitle}
                </h2>
              </div>
              <p className="font-merriweather text-xs text-[#5d4037]">
                {t.game.namesHint}
              </p>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence>
                  {gameState.availableNames.map((person) => (
                    <motion.button
                      key={person.nameKey}
                      layout={!shouldReduceMotion}
                      exit={{ opacity: 0, x: 20 }}
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          type: "guess",
                          nameKey: person.nameKey,
                          fullName: person.fullName,
                        })
                      }
                      className="w-full text-left px-4 py-3 pixel-btn pixel-btn-parchment hover:!bg-[#3e2723] hover:!text-[#f4e4bc] font-merriweather font-bold text-sm"
                    >
                      {person.fullName}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {gameState.totalCount - gameState.answeredCount > 1 && (
                <button
                  type="button"
                  onClick={() => setPendingAction({ type: "pass" })}
                  className="w-full py-3 pixel-btn pixel-btn-wood font-cinzel font-bold text-sm flex items-center justify-center gap-2"
                >
                  <SkipForward size={16} />
                  {t.game.passButton}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS / CLASSIC SCREEN */}
      {resultsState && (
        <div className="z-10 w-full max-w-4xl mt-6 space-y-6">
          <div className="pixel-panel p-6 md:p-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <PixelSprite name="gift_box" width={36} height={36} />
              <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-[#2b1b17]">
                {resultsState.mode === "classic"
                  ? t.game.results.classicTitle
                  : t.game.results.title}
              </h1>
              <PixelAvatar
                config={cachedAvatar ?? generateRandomAvatar(username)}
                size={40}
              />
            </div>

            {resultsState.mode === "game" ? (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <span className="px-4 py-1.5 bg-[#3e2723] text-[#f4e4bc] border-2 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] font-cinzel font-bold text-sm">
                  {t.game.results.totalScore(
                    resultsState.totalPoints ?? 0,
                    resultsState.maxPoints ?? 0
                  )}
                </span>
                <span className="px-4 py-1.5 bg-[#b91c1c] text-[#fffdf7] border-2 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] font-cinzel font-bold text-sm">
                  %{resultsState.percent ?? 0}
                </span>
              </div>
            ) : (
              <p className="font-merriweather text-sm text-[#5d4037]">
                {t.game.results.classicSubtitle}
              </p>
            )}
          </div>

          {resultsState.cards.length === 0 ? (
            <div className="pixel-panel p-8 text-center font-merriweather text-[#5d4037]">
              {t.game.results.classicEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {resultsState.cards.map((card) => (
                <div
                  key={card.id}
                  className="pixel-panel p-6 space-y-4 relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#8b7355]/40 pb-3">
                    <div className="flex items-center gap-2">
                      <PixelSprite name="holly" width={20} height={15} />
                      <h3 className="font-cinzel text-xl font-bold text-[#2b1b17]">
                        {card.authorName}
                      </h3>
                    </div>

                    {resultsState.mode === "game" && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 border-2 border-[#2b1b17] text-xs font-cinzel font-bold ${
                            card.outcome === "correct"
                              ? "bg-[#1b4332] text-[#f4e4bc]"
                              : card.outcome === "passed"
                                ? "bg-zinc-600 text-white"
                                : "bg-[#b91c1c] text-white"
                          }`}
                        >
                          {card.outcome === "correct"
                            ? t.game.results.correct
                            : card.outcome === "passed"
                              ? t.game.results.passed
                              : t.game.results.wrong}
                        </span>
                        <span className="font-cinzel font-bold text-sm text-[#2b1b17]">
                          {(card.points ?? 0) >= 0 ? `+${card.points}` : card.points}
                        </span>
                      </div>
                    )}
                  </div>

                  {resultsState.mode === "game" && card.outcome === "wrong" && card.guessedName && (
                    <p className="text-xs font-merriweather text-[#5d4037]">
                      {t.game.results.yourGuess}: <strong>{card.guessedName}</strong>
                    </p>
                  )}

                  <div className="space-y-2 text-sm font-merriweather text-[#2b1b17]">
                    <p className="text-xs font-cinzel font-bold text-[#5d4037] uppercase">
                      {t.game.results.cluesLabel}
                    </p>
                    <p className="italic">"{card.clueText}"</p>
                    {(card.clueExtraList ?? (card.clueExtra ? [card.clueExtra] : [])).map((extra, i) => (
                      <p key={i} className="text-xs text-[#5d4037]">+ {extra}</p>
                    ))}
                    {card.cluePhotoUrl && (
                      <img
                        src={card.cluePhotoUrl}
                        alt="Clue"
                        onClick={() => setPolaroidUrl(card.cluePhotoUrl)}
                        className="h-32 w-32 object-cover border-3 border-[#2b1b17] mt-2 cursor-zoom-in hover:scale-[1.03] transition-transform"
                      />
                    )}
                  </div>

                  {(card.note || card.notePhotoUrl) && (
                    <div className="relative pixel-inset p-4 pr-12">
                      <p className="text-xs font-cinzel font-bold text-[#5d4037] uppercase mb-1">
                        {t.game.results.noteLabel}
                      </p>
                      {card.note && (
                        <p className="font-hand text-base text-[#2b1b17] whitespace-pre-wrap">
                          {card.note}
                        </p>
                      )}
                      {card.notePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setPolaroidUrl(card.notePhotoUrl)}
                          className="absolute bottom-3 right-3 p-2 bg-[#f4e4bc] border-2 border-[#2b1b17] text-[#b91c1c] hover:scale-110 transition-transform shadow-[2px_2px_0_#2b1b17]"
                          aria-label={t.game.results.openAttachment}
                          title={t.game.results.openAttachment}
                        >
                          <Paperclip size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CIRCLE LEADERBOARD & RESULT SHARE */}
          {resultsState.mode === "game" && (
            <div className="space-y-6 pt-2">
              <div className="pixel-panel p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(resultsState.shareInCircle)}
                    disabled={togglingShare}
                    onClick={() => handleToggleCircleShare(!resultsState.shareInCircle)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] transition-colors cursor-pointer select-none disabled:opacity-60 ${
                      resultsState.shareInCircle
                        ? "bg-[#1b4332] text-[#f4e4bc]"
                        : "bg-[#e6d5aa] text-[#2b1b17]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PixelSprite
                        name={resultsState.shareInCircle ? "trophy_crown" : "bell"}
                        width={20}
                        height={20}
                      />
                      <span className="font-merriweather text-xs sm:text-sm font-bold">
                        {t.game.results.shareInCircleToggle}
                      </span>
                    </div>

                    {/* Pixel Switch Track */}
                    <div
                      className={`w-11 h-6 border-2 border-[#2b1b17] p-0.5 flex items-center transition-colors shrink-0 ${
                        resultsState.shareInCircle ? "bg-[#fbbf24] justify-end" : "bg-[#d4c39b] justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-[#fffdf7] border-2 border-[#2b1b17]" />
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={sharingImage}
                    onClick={handleShareResultImage}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-xs disabled:opacity-60"
                  >
                    <Download size={16} />
                    {t.game.results.shareResultImage}
                  </button>
                </div>

                <div className="pt-4 border-t-2 border-[#8b7355]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PixelSprite name="trophy_crown" width={28} height={28} />
                      <h2 className="font-cinzel text-xl font-bold text-[#2b1b17]">
                        {t.game.results.circleTitle}
                      </h2>
                    </div>
                    <PixelSprite name="pine_tree" width={24} height={32} />
                  </div>

                  {circleEntries.length <= 1 ? (
                    <p className="font-merriweather text-xs text-[#5d4037]">
                      {t.game.results.circleEmpty}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {circleEntries.map((entry, idx) => (
                        <div
                          key={`${entry.fullName}-${idx}`}
                          className={`flex items-center justify-between px-4 py-3 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] ${
                            entry.isSelf
                              ? "bg-[#1b4332] text-[#f4e4bc]"
                              : idx === 0
                                ? "bg-[#fbbf24] text-[#2b1b17]"
                                : "bg-[#e6d5aa] text-[#2b1b17]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {idx === 0 && <PixelSprite name="trophy_crown" width={20} height={20} />}
                            <PixelAvatar
                              config={entry.avatarId ?? generateRandomAvatar(entry.fullName)}
                              size={32}
                            />
                            <span className="font-merriweather font-bold text-sm">
                              #{idx + 1} {entry.fullName}{" "}
                              {entry.isSelf ? `(${t.game.results.youLabel})` : ""}
                            </span>
                          </div>
                          <span className="font-cinzel font-bold text-base">
                            %{entry.percent}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Off-screen result story card for html-to-image */}
              <div className="fixed -left-[9999px] top-0">
                <div
                  ref={resultStoryRef}
                  className="w-[1080px] h-[1920px] bg-[#0a1410] flex flex-col items-center justify-center relative overflow-hidden"
                  style={{ fontFamily: "var(--font-alice), monospace" }}
                >
                  <div className="z-10 flex items-end justify-center gap-10 mb-10">
                    <img
                      src="/pixel/pine_tree.png"
                      alt=""
                      width={144}
                      height={192}
                      style={{ imageRendering: "pixelated" }}
                    />
                    <img
                      src="/pixel/trophy_crown.png"
                      alt=""
                      width={144}
                      height={144}
                      style={{ imageRendering: "pixelated" }}
                    />
                    <img
                      src="/pixel/santa_cat.png"
                      alt=""
                      width={144}
                      height={144}
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="z-10 bg-[#f4e4bc] p-16 border-[14px] border-[#2b1b17] shadow-[20px_20px_0_#040806] text-center max-w-[840px] w-full space-y-10">
                    <h1 className="text-6xl text-[#2b1b17] font-bold">
                      {t.shareDrawer.storyTitle}
                    </h1>
                    <p className="text-4xl text-[#5d4037]">
                      {t.dashboard.seasonTitle(resultsState.season)}
                    </p>
                    <div className="bg-[#b91c1c] text-[#fffdf7] border-[8px] border-[#2b1b17] shadow-[10px_10px_0_#2b1b17] text-8xl py-10 px-16 inline-block font-bold">
                      %{resultsState.percent ?? 0}
                    </div>
                    <p className="text-4xl text-[#2b1b17] font-bold">
                      {t.game.results.totalScore(
                        resultsState.totalPoints ?? 0,
                        resultsState.maxPoints ?? 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RULES & SCORING MODAL */}
      <PixelRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="pixel-panel max-w-sm w-full p-6 space-y-4 text-center"
            >
              <h3 className="font-cinzel text-lg font-bold text-[#2b1b17]">
                {t.game.confirmTitle}
              </h3>
              <p className="font-merriweather text-sm text-[#5d4037]">
                {pendingAction.type === "pass"
                  ? t.game.confirmPass
                  : t.game.confirmGuess(pendingAction.fullName)}
              </p>
              <div className="flex items-stretch gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction(null)}
                  className="flex-1 min-h-[44px] py-2.5 pixel-btn pixel-btn-parchment font-cinzel font-bold text-sm flex items-center justify-center"
                >
                  {t.game.confirmCancel}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmAction}
                  className="flex-1 min-h-[44px] py-2.5 pixel-btn pixel-btn-red font-cinzel font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  {t.game.confirmOk}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POLAROID PHOTO MODAL */}
      <AnimatePresence>
        {polaroidUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPolaroidUrl(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#fffdf7] p-3 border-4 border-[#2b1b17] shadow-[8px_8px_0_#2b1b17] w-fit max-w-[90vw] sm:max-w-md mx-auto flex items-center justify-center"
            >
              <button
                type="button"
                onClick={() => setPolaroidUrl(null)}
                className="absolute -top-3 -right-3 bg-[#b91c1c] text-white border-2 border-[#2b1b17] p-1.5"
              >
                <X size={16} />
              </button>
              <img
                src={polaroidUrl}
                alt="Attachment"
                className="block mx-auto max-w-full max-h-[75vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
