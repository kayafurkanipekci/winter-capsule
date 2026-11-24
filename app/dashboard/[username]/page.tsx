"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SnowEffect from "@/components/SnowEffect";
import Mailbox from "@/components/Mailbox";
import ShareDrawer from "@/components/ShareDrawer";
import CalendarReminder from "@/components/CalendarReminder";
import { Archive, LogOut, Send, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { normalizeName } from "@/lib/normalize";

interface SeasonSummary {
  season: number;
  status: "collecting" | "ready" | "in_progress" | "finished" | "classic";
  cardCount: number;
  unlockAt: string;
  isUnlocked: boolean;
  percent: number | null;
}

interface AuthoredCard {
  id: string;
  season: number;
  receiverName: string;
  outcome: "pending" | "found" | "missed" | "passed" | "classic";
  cluesUsed?: number;
  guessedName?: string | null;
}

interface DashboardUser {
  id: string;
  username: string;
  fullName: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PersonalDashboard({ params }: PageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const resolvedParams = use(params);
  const routeUsername = decodeURIComponent(resolvedParams.username);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [authoredCards, setAuthoredCards] = useState<AuthoredCard[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [showShareDrawer, setShowShareDrawer] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/dashboard").then(async (res) => {
        if (res.status === 401) return { unauthorized: true };
        return res.json();
      }),
      fetch("/api/me/authored")
        .then((res) => (res.ok ? res.json() : { cards: [] }))
        .catch(() => ({ cards: [] })),
    ])
      .then(([dashData, authoredData]) => {
        if (cancelled) return;
        if (!dashData || dashData.unauthorized) {
          router.replace("/login");
          return;
        }

        if (!dashData.user || normalizeName(dashData.user.username) !== normalizeName(routeUsername)) {
          router.replace("/login");
          return;
        }

        setUser(dashData.user);
        setSeasons(dashData.seasons ?? []);
        setActiveSeason(dashData.activeSeason ?? null);
        setAuthoredCards(authoredData?.cards ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [routeUsername, router]);

  const currentSeasonInfo = seasons.find((s) => s.season === activeSeason) ?? seasons[0] ?? null;
  const pastSeasons = seasons.filter((s) => s.season !== currentSeasonInfo?.season);

  useEffect(() => {
    if (!currentSeasonInfo) return;

    const unlockMs = new Date(currentSeasonInfo.unlockAt).getTime();

    const updateCountdown = () => {
      const distance = unlockMs - Date.now();
      if (distance <= 0) {
        setTimeLeft(t.dashboard.sealsBroken);
        return true;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(t.dashboard.countdown(days, hours));
      return false;
    };

    if (updateCountdown()) return;
    const timer = setInterval(() => {
      if (updateCountdown()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentSeasonInfo, t]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const formatAuthoredOutcome = (card: AuthoredCard): string => {
    switch (card.outcome) {
      case "found":
        return t.dashboard.authored.found(card.cluesUsed ?? 1);
      case "missed":
        return card.guessedName
          ? t.dashboard.authored.missedWithGuess(card.guessedName)
          : t.dashboard.authored.missed;
      case "passed":
        return t.dashboard.authored.passed;
      case "classic":
        return t.dashboard.authored.classic;
      default:
        return t.dashboard.authored.pending;
    }
  };

  if (loading || !user || !currentSeasonInfo) {
    return (
      <main className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <SnowEffect />
        <p className="z-10 font-cinzel text-[#3e2723] dark:text-amber-300 animate-pulse">
          {t.dashboard.loading}
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background overflow-y-auto custom-scrollbar flex flex-col items-center p-4">
      <SnowEffect />

      <div className="w-full max-w-5xl flex items-center justify-between pt-2 z-20">
        <button
          onClick={handleLogout}
          className="text-[#3e2723] dark:text-amber-500/70 hover:text-[#5d4037] dark:hover:text-amber-400 font-cinzel text-sm transition-colors flex items-center gap-1.5"
        >
          <LogOut size={14} />
          {t.dashboard.logout}
        </button>

        <button
          onClick={() => setShowShareDrawer(true)}
          className="text-[#3e2723] dark:text-amber-200/80 hover:text-[#5d4037] dark:hover:text-white font-cinzel text-sm border-b border-dashed border-[#3e2723] dark:border-amber-500/30 transition-colors flex items-center gap-1 mr-20"
        >
          <Share2 size={14} />
          {t.dashboard.shareButton}
        </button>
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center mt-10 gap-8 pb-20">
        <div className="text-center space-y-3">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#3e2723] dark:text-amber-400">
            {user.fullName}
          </h1>

          <div className="inline-block bg-[#f4e4bc] dark:bg-black/40 px-6 py-2 rounded-full border border-[#3e2723] dark:border-amber-500/30 backdrop-blur-md shadow-md dark:shadow-none">
            <p className="font-cinzel text-[#3e2723] dark:text-amber-100 text-base">
              {t.dashboard.seasonTitle(currentSeasonInfo.season)} ·{" "}
              {currentSeasonInfo.isUnlocked ? t.dashboard.sealsOpened : timeLeft}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 w-full"
        >
          <Mailbox
            username={user.fullName}
            messageCount={currentSeasonInfo.cardCount}
            isLocked={!currentSeasonInfo.isUnlocked}
            onClick={() => {}}
            isOpen={false}
          />

          <div className="bg-[#f4e4bc] border-2 border-[#3e2723] rounded-xl p-5 text-center shadow-lg max-w-md w-full space-y-3">
            <p className="font-cinzel text-lg font-bold text-[#3e2723]">
              {t.dashboard.cardsCollected(currentSeasonInfo.cardCount)}
            </p>
            <p className="font-merriweather text-xs text-[#5d4037] italic">
              {t.dashboard.minFourHint}
            </p>

            {currentSeasonInfo.isUnlocked && (
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/${encodeURIComponent(user.username)}/game/${currentSeasonInfo.season}`
                  )
                }
                className="w-full py-3 bg-[#8b0000] text-[#f4e4bc] font-cinzel font-bold rounded shadow hover:bg-[#a50000] transition-colors"
              >
                {currentSeasonInfo.status === "in_progress"
                  ? t.dashboard.continueGame
                  : currentSeasonInfo.status === "finished" || currentSeasonInfo.status === "classic"
                    ? t.dashboard.viewResults
                    : t.dashboard.openBox}
              </button>
            )}

            {!currentSeasonInfo.isUnlocked && (
              <div className="pt-1">
                <CalendarReminder />
              </div>
            )}
          </div>
        </motion.div>

        {/* Authored Cards Section */}
        <section className="w-full bg-[#f4e4bc] border-2 border-[#3e2723] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-[#8b7355]/30 pb-2">
            <Send size={16} className="text-[#8b0000]" />
            <h2 className="font-cinzel text-lg font-bold text-[#3e2723]">
              {t.dashboard.authored.title}
            </h2>
          </div>

          {authoredCards.length === 0 ? (
            <p className="font-merriweather text-xs text-[#5d4037] italic text-center py-2">
              {t.dashboard.authored.empty}
            </p>
          ) : (
            <div className="space-y-2.5">
              {authoredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-[#e6d5aa]/60 border border-[#8b7355]/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <p className="font-cinzel font-bold text-sm text-[#3e2723]">
                      {card.receiverName}
                    </p>
                    <p className="text-[11px] font-cinzel text-[#8b7355]">
                      {t.dashboard.seasonTitle(card.season)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-merriweather font-bold ${
                      card.outcome === "found"
                        ? "text-green-800"
                        : card.outcome === "missed"
                          ? "text-[#8b0000]"
                          : "text-[#5d4037]"
                    }`}
                  >
                    {formatAuthoredOutcome(card)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Seasons Section */}
        {pastSeasons.length > 0 && (
          <section className="w-full bg-[#f4e4bc] border-2 border-[#3e2723] rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 border-b border-[#8b7355]/30 pb-2">
              <Archive size={16} className="text-[#8b0000]" />
              <h2 className="font-cinzel text-lg font-bold text-[#3e2723]">
                {t.dashboard.pastSeasonsTitle}
              </h2>
            </div>

            <div className="space-y-2">
              {pastSeasons.map((s) => (
                <div
                  key={s.season}
                  className="bg-[#e6d5aa]/60 border border-[#8b7355]/30 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-cinzel font-bold text-sm text-[#3e2723]">
                      {t.dashboard.seasonTitle(s.season)}
                    </p>
                    <p className="text-xs font-merriweather text-[#5d4037]">
                      {t.dashboard.cardsCollected(s.cardCount)}
                      {s.percent !== null ? ` · %${s.percent}` : ""}
                    </p>
                  </div>
                  {s.isUnlocked && (
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/${encodeURIComponent(user.username)}/game/${s.season}`
                        )
                      }
                      className="px-3 py-1.5 bg-[#3e2723] text-[#f4e4bc] font-cinzel text-xs font-bold rounded hover:bg-[#5d4037]"
                    >
                      {s.status === "in_progress"
                        ? t.dashboard.continueGame
                        : s.status === "finished" || s.status === "classic"
                          ? t.dashboard.viewResults
                          : t.dashboard.openBox}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ShareDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        username={user.username}
      />
    </main>
  );
}
