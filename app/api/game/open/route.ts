import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";
import { getActiveSeason, isSeasonUnlocked } from "@/lib/capsuleTime";
import { buildClueOrder, shuffleArray } from "@/lib/server/game";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const season = Number(body?.season ?? getActiveSeason());
    if (!Number.isInteger(season) || season < 2020 || season > 2100) {
      return NextResponse.json({ error: "invalid_season" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Idempotent check: return existing session if already opened (including dev-opened sessions)
    const { data: existingSession } = await supabase
      .from("game_sessions")
      .select("id, mode, status")
      .eq("owner_id", user.id)
      .eq("season", season)
      .maybeSingle();

    if (existingSession) {
      return NextResponse.json({
        mode: existingSession.mode,
        status: existingSession.status,
      });
    }

    if (!isSeasonUnlocked(season)) {
      return NextResponse.json({ error: "season_locked" }, { status: 403 });
    }

    const { data: entries, error: entriesErr } = await supabase
      .from("entries")
      .select("id, clue_text, clue_extra, clue_photo_path")
      .eq("receiver_id", user.id)
      .eq("season", season);

    if (entriesErr) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const list = entries ?? [];
    if (list.length < 4) {
      const { data: classicSession, error: classicErr } = await supabase
        .from("game_sessions")
        .insert({
          owner_id: user.id,
          season,
          mode: "classic",
          status: "finished",
          finished_at: new Date().toISOString(),
        })
        .select("mode, status")
        .single();

      if (classicErr) {
        if (classicErr.code === "23505") {
          const { data: retry } = await supabase
            .from("game_sessions")
            .select("mode, status")
            .eq("owner_id", user.id)
            .eq("season", season)
            .single();
          return NextResponse.json(retry);
        }
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }

      return NextResponse.json(classicSession, { status: 201 });
    }

    const { data: gameSession, error: gameErr } = await supabase
      .from("game_sessions")
      .insert({
        owner_id: user.id,
        season,
        mode: "game",
        status: "in_progress",
        share_in_circle: true,
      })
      .select("id, mode, status")
      .single();

    if (gameErr || !gameSession) {
      if (gameErr?.code === "23505") {
        const { data: retry } = await supabase
          .from("game_sessions")
          .select("mode, status")
          .eq("owner_id", user.id)
          .eq("season", season)
          .single();
        return NextResponse.json(retry);
      }
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const shuffledEntries = shuffleArray(list);
    const cardRows = shuffledEntries.map((entry, idx) => ({
      session_id: gameSession.id,
      entry_id: entry.id,
      position: idx,
      clue_order: buildClueOrder(entry),
      revealed_count: 1,
      status: "pending",
    }));

    const { error: cardsErr } = await supabase.from("game_cards").insert(cardRows);
    if (cardsErr) {
      await supabase.from("game_sessions").delete().eq("id", gameSession.id);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json(
      { mode: gameSession.mode, status: gameSession.status },
      { status: 201 }
    );
  } catch (err) {
    console.error("Open game error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
