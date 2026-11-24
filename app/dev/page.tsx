"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Play, PlusCircle, RotateCcw, ExternalLink } from "lucide-react";

interface DevUser {
  id: string;
  username: string;
  fullName: string;
  pin: string;
  cardCount: number;
  gameStatus: string;
  percent: number | null;
}

interface DevEntry {
  id: string;
  receiverName: string;
  authorName: string;
  clueText: string;
  hasPhoto: boolean;
  hasNote: boolean;
  createdAt: string;
}

interface DevState {
  activeSeason: number;
  serverNow: string;
  isSeasonUnlocked: boolean;
  currentUser: { id: string; username: string; fullName: string } | null;
  users: DevUser[];
  entries: DevEntry[];
}

export default function DevConsolePage() {
  const router = useRouter();
  const [data, setData] = useState<DevState | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dev");
    if (res.status === 404) {
      setUnavailable(true);
      return;
    }
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (
    action: "impersonate" | "open_box" | "reset_game" | "seed_cards",
    userId: string
  ) => {
    setBusyId(`${action}:${userId}`);
    try {
      const res = await fetch("/api/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        if (action === "impersonate" && json.username) {
          router.push(`/dashboard/${encodeURIComponent(json.username)}`);
          return;
        }
        if (action === "open_box" && json.username && json.season) {
          router.push(`/dashboard/${encodeURIComponent(json.username)}/game/${json.season}`);
          return;
        }
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  if (unavailable) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="font-mono text-sm text-zinc-500">404 — Dev console is disabled in production.</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="font-cinzel text-sm animate-pulse">Loading dev console...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#8b7355]/30 pb-4">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-[#3e2723] dark:text-amber-400">
            Dev Console
          </h1>
          <p className="text-xs font-mono text-[#5d4037] dark:text-amber-200/70">
            Season: {data.activeSeason} · Unlocked: {String(data.isSeasonUnlocked)} · Logged in:{" "}
            {data.currentUser ? `${data.currentUser.fullName} (@${data.currentUser.username})` : "none"}
          </p>
        </div>
        <div className="flex gap-3 text-xs font-cinzel">
          <Link href="/" className="underline">Home</Link>
          <Link href="/create" className="underline">Create Box</Link>
          <Link href="/login" className="underline">Login</Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-cinzel text-lg font-bold text-[#3e2723] dark:text-amber-300">
          Accounts ({data.users.length})
        </h2>
        <div className="grid gap-3">
          {data.users.map((u) => (
            <div
              key={u.id}
              className="bg-[#f4e4bc] border-2 border-[#3e2723] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-0.5 text-[#3e2723]">
                <p className="font-cinzel font-bold">
                  {u.fullName}{" "}
                  <span className="font-mono text-xs text-[#8b7355]">@{u.username}</span>
                </p>
                <p className="font-mono text-xs text-[#5d4037]">
                  PIN: {u.pin} · Cards: {u.cardCount} · Status: {u.gameStatus}
                  {u.percent !== null ? ` (${u.percent}%)` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${encodeURIComponent(u.username)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e6d5aa] text-[#3e2723] border border-[#8b7355] rounded text-xs font-cinzel font-bold"
                >
                  <ExternalLink size={12} />
                  Invite Link
                </Link>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => runAction("impersonate", u.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#3e2723] text-[#f4e4bc] rounded text-xs font-cinzel font-bold disabled:opacity-50"
                >
                  <KeyRound size={12} />
                  Dashboard
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => runAction("seed_cards", u.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-700 text-white rounded text-xs font-cinzel font-bold disabled:opacity-50"
                >
                  <PlusCircle size={12} />
                  Seed 4 Cards
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => runAction("open_box", u.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8b0000] text-white rounded text-xs font-cinzel font-bold disabled:opacity-50"
                >
                  <Play size={12} />
                  Open Box (Bypass Date)
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => runAction("reset_game", u.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-700 text-white rounded text-xs font-cinzel font-bold disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  Reset Game
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 pb-12">
        <h2 className="font-cinzel text-lg font-bold text-[#3e2723] dark:text-amber-300">
          Cards in Season {data.activeSeason} ({data.entries.length})
        </h2>
        <div className="space-y-2">
          {data.entries.map((e) => (
            <div
              key={e.id}
              className="bg-[#f4e4bc] border border-[#8b7355] rounded p-3 text-xs text-[#3e2723] space-y-1"
            >
              <p className="font-bold">
                {e.authorName} → {e.receiverName}{" "}
                <span className="font-mono text-[#8b7355]">
                  ({e.hasPhoto ? "photo" : "no-photo"}, {e.hasNote ? "note" : "no-note"})
                </span>
              </p>
              <p className="italic">"{e.clueText}"</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
