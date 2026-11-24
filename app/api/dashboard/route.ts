import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";
import {
  getActiveSeason,
  getNow,
  getUnlockInstant,
  isSeasonUnlocked,
} from "@/lib/capsuleTime";

export const runtime = "nodejs";

export type SeasonStatus = "collecting" | "ready" | "in_progress" | "finished" | "classic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const now = getNow();
    const activeSeason = getActiveSeason(now);
    const supabase = getServerSupabase();

    const [{ data: entries }, { data: sessions }] = await Promise.all([
      supabase
        .from("entries")
        .select("season")
        .eq("receiver_id", user.id),
      supabase
        .from("game_sessions")
        .select("season, mode, status, total_points, max_points, percent")
        .eq("owner_id", user.id),
    ]);

    const countsBySeason = new Map<number, number>();
    for (const row of entries ?? []) {
      countsBySeason.set(row.season, (countsBySeason.get(row.season) ?? 0) + 1);
    }

    const sessionsBySeason = new Map<number, NonNullable<typeof sessions>[number]>();
    for (const row of sessions ?? []) {
      sessionsBySeason.set(row.season, row);
    }

    const seasonSet = new Set<number>([activeSeason, ...countsBySeason.keys(), ...sessionsBySeason.keys()]);
    const sortedSeasons = Array.from(seasonSet).sort((a, b) => b - a);

    const seasons = sortedSeasons.map((season) => {
      const cardCount = countsBySeason.get(season) ?? 0;
      const gameSession = sessionsBySeason.get(season);
      const unlocked = isSeasonUnlocked(season, now);
      const unlockAt = getUnlockInstant(season).toISOString();

      let status: SeasonStatus;
      if (gameSession) {
        if (gameSession.mode === "classic") {
          status = "classic";
        } else {
          status = gameSession.status === "finished" ? "finished" : "in_progress";
        }
      } else {
        status = unlocked ? "ready" : "collecting";
      }

      return {
        season,
        status,
        cardCount,
        unlockAt,
        isUnlocked: unlocked,
        percent: gameSession?.percent ?? null,
      };
    });

    return NextResponse.json({
      user,
      activeSeason,
      serverNow: now.toISOString(),
      seasons,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
