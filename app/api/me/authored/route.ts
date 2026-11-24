import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = getServerSupabase();

    const { data: myEntries, error: entriesErr } = await supabase
      .from("entries")
      .select("id, receiver_id, season, show_wrong_guess, created_at")
      .eq("author_user_id", user.id)
      .order("created_at", { ascending: false });

    if (entriesErr) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const entriesList = myEntries ?? [];
    if (entriesList.length === 0) {
      return NextResponse.json({ cards: [] });
    }

    const receiverIds = Array.from(new Set(entriesList.map((e) => e.receiver_id)));
    const seasons = Array.from(new Set(entriesList.map((e) => e.season)));

    let receivers: Array<{ id: string; full_name: string; show_wrong_guess?: boolean }> = [];
    const { data: receiversWithFlag, error: recvErr } = await supabase
      .from("users")
      .select("id, full_name, show_wrong_guess")
      .in("id", receiverIds);

    if (recvErr) {
      const { data: fallbackReceivers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", receiverIds);
      receivers = fallbackReceivers ?? [];
    } else {
      receivers = receiversWithFlag ?? [];
    }

    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("id, owner_id, season, mode, status")
      .in("owner_id", receiverIds)
      .in("season", seasons);

    const receiverMap = new Map<string, { fullName: string; showWrongGuess: boolean }>();
    for (const r of receivers) {
      receiverMap.set(r.id, {
        fullName: r.full_name,
        showWrongGuess: Boolean(r.show_wrong_guess),
      });
    }

    const sessionMap = new Map<string, NonNullable<typeof sessions>[number]>();
    const finishedGameSessionIds: string[] = [];
    for (const s of sessions ?? []) {
      sessionMap.set(`${s.owner_id}:${s.season}`, s);
      if (s.mode === "game" && s.status === "finished") {
        finishedGameSessionIds.push(s.id);
      }
    }

    const cardByEntryId = new Map<
      string,
      {
        id: string;
        status: string;
        guessed_card_id: string | null;
        revealed_count: number;
      }
    >();
    const guessedCardIds: string[] = [];

    if (finishedGameSessionIds.length > 0) {
      const { data: cards } = await supabase
        .from("game_cards")
        .select("id, entry_id, status, guessed_card_id, revealed_count")
        .in("session_id", finishedGameSessionIds)
        .in(
          "entry_id",
          entriesList.map((e) => e.id)
        );

      for (const c of cards ?? []) {
        cardByEntryId.set(c.entry_id, c);
        if (c.guessed_card_id && c.guessed_card_id !== c.id) {
          guessedCardIds.push(c.guessed_card_id);
        }
      }
    }

    const guessedAuthorMap = new Map<string, string>();
    if (guessedCardIds.length > 0) {
      const { data: guessedCards } = await supabase
        .from("game_cards")
        .select("id, entries ( author_name )")
        .in("id", guessedCardIds);

      for (const gc of guessedCards ?? []) {
        const entry = Array.isArray(gc.entries) ? gc.entries[0] : gc.entries;
        if (entry?.author_name) {
          guessedAuthorMap.set(gc.id, entry.author_name);
        }
      }
    }

    const result = entriesList.map((entry) => {
      const receiverInfo = receiverMap.get(entry.receiver_id);
      const receiverName = receiverInfo?.fullName ?? "";
      const allowWrongGuess = Boolean(receiverInfo?.showWrongGuess || entry.show_wrong_guess);
      const session = sessionMap.get(`${entry.receiver_id}:${entry.season}`);

      if (!session || session.status !== "finished") {
        return {
          id: entry.id,
          season: entry.season,
          receiverName,
          outcome: "pending" as const,
        };
      }

      if (session.mode === "classic") {
        return {
          id: entry.id,
          season: entry.season,
          receiverName,
          outcome: "classic" as const,
        };
      }

      const card = cardByEntryId.get(entry.id);
      if (!card) {
        return {
          id: entry.id,
          season: entry.season,
          receiverName,
          outcome: "pending" as const,
        };
      }

      if (card.status === "passed") {
        return {
          id: entry.id,
          season: entry.season,
          receiverName,
          outcome: "passed" as const,
        };
      }

      if (card.guessed_card_id === card.id) {
        return {
          id: entry.id,
          season: entry.season,
          receiverName,
          outcome: "found" as const,
          cluesUsed: card.revealed_count,
        };
      }

      const guessedName =
        allowWrongGuess && card.guessed_card_id
          ? (guessedAuthorMap.get(card.guessed_card_id) ?? null)
          : null;

      return {
        id: entry.id,
        season: entry.season,
        receiverName,
        outcome: "missed" as const,
        guessedName,
      };
    });

    return NextResponse.json({ cards: result });
  } catch (err) {
    console.error("Authored cards error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
