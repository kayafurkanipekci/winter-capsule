import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";
import { createSignedPhotoUrl, type ClueType } from "@/lib/server/game";

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
      .select("id, mode, status")
      .eq("owner_id", user.id)
      .eq("season", season)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    if (session.mode === "classic" || session.status === "finished") {
      return NextResponse.json({
        mode: session.mode,
        status: session.status,
      });
    }

    const { data: cards, error: cardsErr } = await supabase
      .from("game_cards")
      .select(
        "id, position, name_key, clue_order, revealed_count, status, guessed_card_id, entries ( author_name, clue_text, clue_extra, clue_photo_path )"
      )
      .eq("session_id", session.id)
      .order("position", { ascending: true });

    if (cardsErr || !cards) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const usedCardIds = new Set<string>();
    let answeredCount = 0;

    for (const c of cards) {
      if (c.status !== "pending") answeredCount++;
      if (c.guessed_card_id) usedCardIds.add(c.guessed_card_id);
    }

    const nextCard = cards.find((c) => c.status === "pending");
    if (!nextCard) {
      return NextResponse.json({
        mode: session.mode,
        status: "finished",
      });
    }

    const nextEntry = Array.isArray(nextCard.entries) ? nextCard.entries[0] : nextCard.entries;
    if (!nextEntry) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const clueOrder = nextCard.clue_order as ClueType[];
    const visibleTypes = clueOrder.slice(0, nextCard.revealed_count);

    const revealedClues: Array<{ type: ClueType; value: string }> = [];
    for (const clueType of visibleTypes) {
      if (clueType === "text") {
        revealedClues.push({ type: "text", value: nextEntry.clue_text });
      } else if (clueType === "extra" && nextEntry.clue_extra) {
        revealedClues.push({ type: "extra", value: nextEntry.clue_extra });
      } else if (clueType === "photo" && nextEntry.clue_photo_path) {
        const signed = await createSignedPhotoUrl(nextEntry.clue_photo_path);
        if (signed) {
          revealedClues.push({ type: "photo", value: signed });
        }
      }
    }

    const availableNames = cards
      .filter((c) => !usedCardIds.has(c.id))
      .map((c) => {
        const entry = Array.isArray(c.entries) ? c.entries[0] : c.entries;
        return {
          nameKey: c.name_key,
          fullName: entry?.author_name ?? "",
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

    return NextResponse.json({
      mode: session.mode,
      status: session.status,
      answeredCount,
      totalCount: cards.length,
      card: {
        id: nextCard.id,
        position: nextCard.position,
        revealedClues,
        revealedCount: nextCard.revealed_count,
        totalClues: clueOrder.length,
      },
      availableNames,
    });
  } catch (err) {
    console.error("Get game error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
