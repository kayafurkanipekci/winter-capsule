import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";
import { createSignedPhotoUrl, parseExtraClues } from "@/lib/server/game";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ season: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { season: rawSeason } = await context.params;
    const season = Number(rawSeason);
    if (!Number.isInteger(season)) {
      return NextResponse.json({ error: "invalid_season" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: session } = await supabase
      .from("game_sessions")
      .select("id, mode, status, total_points, max_points, percent, share_in_circle")
      .eq("owner_id", user.id)
      .eq("season", season)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    if (session.status !== "finished") {
      return NextResponse.json({ error: "game_not_finished" }, { status: 403 });
    }

    if (session.mode === "classic") {
      const { data: entries } = await supabase
        .from("entries")
        .select("id, author_name, clue_text, clue_extra, clue_photo_path, note, note_photo_path")
        .eq("receiver_id", user.id)
        .eq("season", season)
        .order("created_at", { ascending: true });

      const cards = await Promise.all(
        (entries ?? []).map(async (entry) => {
          const extras = parseExtraClues(entry.clue_extra);
          return {
            id: entry.id,
            authorName: entry.author_name,
            clueText: entry.clue_text,
            clueExtra: extras[0] ?? null,
            clueExtraList: extras,
            cluePhotoUrl: await createSignedPhotoUrl(entry.clue_photo_path),
            note: entry.note,
            notePhotoUrl: await createSignedPhotoUrl(entry.note_photo_path),
          };
        })
      );

      return NextResponse.json({
        mode: "classic",
        season,
        cards,
      });
    }

    const { data: gameCards } = await supabase
      .from("game_cards")
      .select(
        "id, position, status, guessed_card_id, points, revealed_count, entries ( author_name, clue_text, clue_extra, clue_photo_path, note, note_photo_path )"
      )
      .eq("session_id", session.id)
      .order("position", { ascending: true });

    const nameByCardId = new Map<string, string>();
    for (const c of gameCards ?? []) {
      const entry = Array.isArray(c.entries) ? c.entries[0] : c.entries;
      if (entry?.author_name) {
        nameByCardId.set(c.id, entry.author_name);
      }
    }

    const cards = await Promise.all(
      (gameCards ?? []).map(async (c) => {
        const entry = Array.isArray(c.entries) ? c.entries[0] : c.entries;
        const guessedName = c.guessed_card_id ? (nameByCardId.get(c.guessed_card_id) ?? null) : null;
        const outcome =
          c.status === "passed"
            ? "passed"
            : c.guessed_card_id === c.id
              ? "correct"
              : "wrong";

        const extras = parseExtraClues(entry?.clue_extra ?? null);
        return {
          id: c.id,
          authorName: entry?.author_name ?? "",
          clueText: entry?.clue_text ?? "",
          clueExtra: extras[0] ?? null,
          clueExtraList: extras,
          cluePhotoUrl: await createSignedPhotoUrl(entry?.clue_photo_path ?? null),
          note: entry?.note ?? null,
          notePhotoUrl: await createSignedPhotoUrl(entry?.note_photo_path ?? null),
          guessedName,
          outcome,
          points: c.points ?? 0,
          revealedCount: c.revealed_count,
        };
      })
    );

    return NextResponse.json({
      mode: "game",
      season,
      totalPoints: session.total_points ?? 0,
      maxPoints: session.max_points ?? cards.length * 3,
      percent: Number(session.percent ?? 0),
      shareInCircle: session.share_in_circle,
      cards,
    });
  } catch (err) {
    console.error("Game results error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
