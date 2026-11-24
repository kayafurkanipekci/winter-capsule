import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => null);
    const cardId = String(body?.cardId ?? "");
    if (!cardId) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: session } = await supabase
      .from("game_sessions")
      .select("id, mode, status")
      .eq("owner_id", user.id)
      .eq("season", season)
      .maybeSingle();

    if (!session || session.mode !== "game" || session.status !== "in_progress") {
      return NextResponse.json({ error: "game_not_active" }, { status: 409 });
    }

    const { data: nextCard } = await supabase
      .from("game_cards")
      .select("id, clue_order, revealed_count, status")
      .eq("session_id", session.id)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextCard || nextCard.id !== cardId) {
      return NextResponse.json({ error: "not_current_card" }, { status: 409 });
    }

    const totalClues = Array.isArray(nextCard.clue_order) ? nextCard.clue_order.length : 1;
    if (nextCard.revealed_count >= totalClues) {
      return NextResponse.json({ error: "no_more_clues" }, { status: 409 });
    }

    const newCount = nextCard.revealed_count + 1;

    // Conditional update prevents double-click race conditions
    const { data: updated, error: updateErr } = await supabase
      .from("game_cards")
      .update({ revealed_count: newCount })
      .eq("id", nextCard.id)
      .eq("status", "pending")
      .eq("revealed_count", nextCard.revealed_count)
      .select("id, revealed_count")
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, revealedCount: updated.revealed_count });
  } catch (err) {
    console.error("Reveal clue error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
