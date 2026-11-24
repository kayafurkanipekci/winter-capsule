"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import SnowEffect from "@/components/SnowEffect";
import {
  Check,
  Download,
  HelpCircle,
  Paperclip,
  SkipForward,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

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
  const [showRulesModal, setShowRulesModal] = useState(false);
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
      if (data.answeredCount === 0 && data.card.revealedCount === 1) {
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
      <main className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <SnowEffect />
        <p className="z-10 font-cinzel text-[#3e2723] dark:text-amber-300 animate-pulse">
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
          className="text-[#3e2723] dark:text-amber-400 hover:underline font-cinzel text-sm"
        >
          ← {t.game.backToDashboard}
        </Link>
      </div>

      {/* ACTIVE GAME SCREEN */}
      {gameState && (
        <div className="z-10 w-full max-w-5xl mt-6 space-y-6">
          {/* Progress Bar */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex justify-between text-xs font-cinzel text-[#3e2723] dark:text-amber-200">
              <span>{t.dashboard.seasonTitle(season)}</span>
              <span>{t.game.progress(gameState.answeredCount, gameState.totalCount)}</span>
            </div>
            <div className="w-full h-2.5 bg-[#e6d5aa] dark:bg-zinc-800 rounded-full overflow-hidden border border-[#8b7355]/40">
              <div
                className="h-full bg-[#8b0000] transition-all duration-300"
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
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: -20, scale: 0.96 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: 20, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="bg-[#f4e4bc] p-6 md:p-8 rounded-lg shadow-2xl border-4 border-[#3e2723] space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-[#8b7355]/30 pb-3">
                    <span className="font-cinzel text-sm font-bold tracking-widest text-[#8b0000]">
                      {t.game.whoAmI}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-[#8b7355] hover:text-[#3e2723]"
                      aria-label={t.game.rulesModal.title}
                    >
                      <HelpCircle size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {gameState.card.revealedClues.map((clue, idx) => (
                      <motion.div
                        key={`${clue.type}-${idx}`}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#e6d5aa]/60 border border-[#8b7355]/30 rounded p-4"
                      >
                        {clue.type === "photo" ? (
                          <img
                            src={clue.value}
                            alt="Clue"
                            className="max-h-72 mx-auto rounded border-2 border-[#3e2723] object-contain"
                          />
                        ) : (
                          <p className="font-merriweather text-[#3e2723] text-base leading-relaxed">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#3e2723] text-[#f4e4bc] font-cinzel text-sm font-bold rounded hover:bg-[#5d4037] disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                        {t.game.revealClue}
                      </button>
                    ) : (
                      <span className="text-xs font-merriweather italic text-[#8b7355]">
                        {t.game.noMoreClues}
                      </span>
                    )}

                    <span className="text-xs font-cinzel text-[#5d4037]">
                      {t.game.cluesRemaining(
                        gameState.card.totalClues - gameState.card.revealedCount
                      )}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right / Bottom: Name List & Pass */}
            <div className="lg:col-span-5 bg-[#f4e4bc] p-6 rounded-lg shadow-xl border-2 border-[#3e2723] space-y-4">
              <h2 className="font-cinzel text-lg font-bold text-[#3e2723]">
                {t.game.namesTitle}
              </h2>
              <p className="font-merriweather text-xs text-[#5d4037] italic">
                {t.game.namesHint}
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
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
                      className="w-full text-left px-4 py-3 bg-[#e6d5aa]/70 hover:bg-[#3e2723] hover:text-[#f4e4bc] text-[#3e2723] font-merriweather text-sm rounded border border-[#8b7355]/40 transition-colors"
                    >
                      {person.fullName}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {gameState.answeredCount + 1 < gameState.totalCount && (
                <button
                  type="button"
                  onClick={() => setPendingAction({ type: "pass" })}
                  className="w-full py-3 bg-[#8b7355]/20 hover:bg-[#8b7355]/30 text-[#5d4037] font-cinzel font-bold text-sm rounded border border-[#8b7355]/40 flex items-center justify-center gap-2 transition-colors"
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
          <div className="bg-[#f4e4bc] p-6 md:p-8 rounded-lg shadow-2xl border-4 border-[#3e2723] text-center space-y-2">
            <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-[#3e2723]">
              {resultsState.mode === "classic"
                ? t.game.results.classicTitle
                : t.game.results.title}
            </h1>
            {resultsState.mode === "game" ? (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <span className="px-4 py-1.5 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded-full text-sm">
                  {t.game.results.totalScore(
                    resultsState.totalPoints ?? 0,
                    resultsState.maxPoints ?? 0
                  )}
                </span>
                <span className="px-4 py-1.5 bg-[#8b0000] text-[#f4e4bc] font-cinzel font-bold rounded-full text-sm">
                  %{resultsState.percent ?? 0}
                </span>
              </div>
            ) : (
              <p className="font-merriweather text-sm text-[#5d4037] italic">
                {t.game.results.classicSubtitle}
              </p>
            )}
          </div>

          {resultsState.cards.length === 0 ? (
            <div className="bg-[#f4e4bc] p-8 rounded-lg border-2 border-[#3e2723] text-center font-merriweather text-[#5d4037]">
              {t.game.results.classicEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {resultsState.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-[#f4e4bc] p-6 rounded-lg shadow-lg border-2 border-[#3e2723] space-y-4 relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8b7355]/30 pb-3">
                    <h3 className="font-cinzel text-xl font-bold text-[#3e2723]">
                      {card.authorName}
                    </h3>

                    {resultsState.mode === "game" && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-cinzel font-bold ${card.outcome === "correct"
                              ? "bg-green-700 text-white"
                              : card.outcome === "passed"
                                ? "bg-zinc-600 text-white"
                                : "bg-[#8b0000] text-white"
                            }`}
                        >
                          {card.outcome === "correct"
                            ? t.game.results.correct
                            : card.outcome === "passed"
                              ? t.game.results.passed
                              : t.game.results.wrong}
                        </span>
                        <span className="font-cinzel font-bold text-sm text-[#3e2723]">
                          {(card.points ?? 0) >= 0 ? `+${card.points}` : card.points}
                        </span>
                      </div>
                    )}
                  </div>

                  {resultsState.mode === "game" && card.guessedName && (
                    <p className="text-xs font-merriweather text-[#5d4037]">
                      {t.game.results.yourGuess}: <strong>{card.guessedName}</strong>
                    </p>
                  )}

                  <div className="space-y-2 text-sm font-merriweather text-[#3e2723]">
                    <p className="text-xs font-cinzel text-[#8b7355] uppercase">
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
                        className="h-32 w-32 object-cover rounded border border-[#3e2723] mt-2"
                      />
                    )}
                  </div>

                  {(card.note || card.notePhotoUrl) && (
                    <div className="relative bg-[#e6d5aa]/70 border border-[#8b7355]/40 rounded p-4 pr-12">
                      <p className="text-xs font-cinzel text-[#8b7355] uppercase mb-1">
                        {t.game.results.noteLabel}
                      </p>
                      {card.note && (
                        <p className="font-hand text-base text-[#3e2723] whitespace-pre-wrap">
                          {card.note}
                        </p>
                      )}
                      {card.notePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setPolaroidUrl(card.notePhotoUrl)}
                          className="absolute bottom-3 right-3 p-2 bg-[#f4e4bc] border border-[#8b7355] rounded-full text-[#8b0000] hover:scale-110 transition-transform shadow"
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

          {resultsState.mode === "game" && (
            <div className="space-y-6 pt-2">
              <div className="bg-[#f4e4bc] p-6 rounded-lg shadow-lg border-2 border-[#3e2723] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(resultsState.shareInCircle)}
                      disabled={togglingShare}
                      onChange={(e) => handleToggleCircleShare(e.target.checked)}
                      className="w-4 h-4 accent-[#8b0000]"
                    />
                    <span className="font-merriweather text-sm text-[#3e2723] font-bold">
                      {t.game.results.shareInCircleToggle}
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={sharingImage}
                    onClick={handleShareResultImage}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-cinzel font-bold text-xs rounded shadow hover:scale-[1.02] transition-transform disabled:opacity-60"
                  >
                    <Download size={16} />
                    {t.game.results.shareResultImage}
                  </button>
                </div>

                <div className="pt-4 border-t border-[#8b7355]/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#8b0000]" />
                    <h2 className="font-cinzel text-lg font-bold text-[#3e2723]">
                      {t.game.results.circleTitle}
                    </h2>
                  </div>

                  {circleEntries.length <= 1 ? (
                    <p className="font-merriweather text-xs text-[#5d4037] italic">
                      {t.game.results.circleEmpty}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {circleEntries.map((entry, idx) => (
                        <div
                          key={`${entry.fullName}-${idx}`}
                          className={`flex items-center justify-between px-4 py-2.5 rounded border ${entry.isSelf
                              ? "bg-[#3e2723] text-[#f4e4bc] border-[#3e2723]"
                              : "bg-[#e6d5aa]/60 text-[#3e2723] border-[#8b7355]/30"
                            }`}
                        >
                          <span className="font-merriweather text-sm">
                            {idx + 1}. {entry.fullName}{" "}
                            {entry.isSelf ? `(${t.game.results.youLabel})` : ""}
                          </span>
                          <span className="font-cinzel font-bold text-sm">
                            %{entry.percent}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden off-screen result story card for html-to-image */}
              <div className="fixed -left-[9999px] top-0">
                <div
                  ref={resultStoryRef}
                  className="w-[1080px] h-[1920px] bg-[#0a0f0d] flex flex-col items-center justify-center relative overflow-hidden"
                  style={{ fontFamily: "serif" }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-[#0a0f0d] to-[#0a0f0d]" />
                  <div className="z-10 bg-[#f4e4bc] p-16 rounded-3xl shadow-[0_0_100px_rgba(251,191,36,0.3)] border-[8px] border-[#3e2723] text-center max-w-[820px] space-y-10">
                    <h1 className="text-6xl text-[#3e2723] font-bold">
                      {t.shareDrawer.storyTitle}
                    </h1>
                    <p className="text-4xl text-[#5d4037]">
                      {t.dashboard.seasonTitle(resultsState.season)}
                    </p>
                    <div className="bg-[#8b0000] text-[#f4e4bc] text-8xl py-10 px-16 rounded-2xl inline-block font-bold">
                      %{resultsState.percent ?? 0}
                    </div>
                    <p className="text-4xl text-[#3e2723] font-bold">
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
      <AnimatePresence>
        {showRulesModal && (
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
              className="bg-[#f4e4bc] border-4 border-[#3e2723] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <h2 className="font-cinzel text-xl font-bold text-[#3e2723] text-center">
                {t.game.rulesModal.title}
              </h2>
              <ul className="space-y-2 text-sm font-merriweather text-[#3e2723] list-disc pl-5">
                <li>{t.game.rulesModal.rule1}</li>
                <li>{t.game.rulesModal.rule2}</li>
                <li>{t.game.rulesModal.rule3}</li>
              </ul>

              <div className="bg-[#e6d5aa]/70 border border-[#8b7355]/40 rounded p-3 space-y-1 text-xs font-merriweather text-[#3e2723]">
                <p className="font-cinzel font-bold text-sm mb-1">
                  {t.game.rulesModal.scoringTitle}
                </p>
                <p>{t.game.rulesModal.scoreNoHint}</p>
                <p>{t.game.rulesModal.scoreOneHint}</p>
                <p>{t.game.rulesModal.scoreTwoHints}</p>
                <p>{t.game.rulesModal.scorePass}</p>
                <p>{t.game.rulesModal.scoreWrong}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full py-3 bg-[#8b0000] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#a50000]"
              >
                {t.game.rulesModal.startButton}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-[#f4e4bc] border-4 border-[#8b0000] rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl text-center"
            >
              <h3 className="font-cinzel text-lg font-bold text-[#3e2723]">
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
                  className="flex-1 min-h-[44px] py-2.5 bg-[#e6d5aa] text-[#3e2723] font-cinzel font-bold text-sm rounded border border-[#8b7355] flex items-center justify-center"
                >
                  {t.game.confirmCancel}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmAction}
                  className="flex-1 min-h-[44px] py-2.5 bg-[#8b0000] text-[#f4e4bc] font-cinzel font-bold text-sm rounded flex items-center justify-center gap-1.5"
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
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, rotate: -6, opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: -2, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, rotate: 4, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white p-3 pb-10 rounded shadow-2xl max-w-md w-full"
            >
              <button
                type="button"
                onClick={() => setPolaroidUrl(null)}
                className="absolute -top-3 -right-3 bg-[#8b0000] text-white rounded-full p-1.5 shadow"
              >
                <X size={16} />
              </button>
              <img
                src={polaroidUrl}
                alt="Attachment"
                className="w-full max-h-[70vh] object-contain rounded-sm"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
