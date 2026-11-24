import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";
import { calculateCardPoints, calculatePercent } from "@/lib/server/game";

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
    const action = body?.action === "pass" ? "pass" : body?.action === "guess" ? "guess" : null;
    const nameKey = body?.nameKey ? String(body.nameKey) : null;

    if (!cardId || !action || (action === "guess" && !nameKey)) {
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

    const { data: allCards, error: cardsErr } = await supabase
      .from("game_cards")
      .select("id, position, name_key, revealed_count, status, guessed_card_id, points")
      .eq("session_id", session.id)
      .order("position", { ascending: true });

    if (cardsErr || !allCards) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const currentCard = allCards.find((c) => c.status === "pending");
    if (!currentCard || currentCard.id !== cardId) {
      return NextResponse.json({ error: "not_current_card" }, { status: 409 });
    }

    const remainingBeforeThis = allCards.filter(
      (c) => c.status === "pending" && c.id !== currentCard.id
    ).length;

    let nextStatus: "guessed" | "passed";
    let guessedCardId: string | null = null;
    let points: number;

    if (action === "pass") {
      if (remainingBeforeThis === 0) {
        return NextResponse.json({ error: "pass_not_allowed_on_last_card" }, { status: 400 });
      }
      nextStatus = "passed";
      points = calculateCardPoints("passed", currentCard.revealed_count, false);
    } else {
      const targetCard = allCards.find((c) => c.name_key === nameKey);
      if (!targetCard) {
        return NextResponse.json({ error: "invalid_name_key" }, { status: 400 });
      }

      const alreadyUsed = allCards.some((c) => c.guessed_card_id === targetCard.id);
      if (alreadyUsed) {
        return NextResponse.json({ error: "name_already_used" }, { status: 409 });
      }

      nextStatus = "guessed";
      guessedCardId = targetCard.id;
      const isCorrect = targetCard.id === currentCard.id;
      points = calculateCardPoints("guessed", currentCard.revealed_count, isCorrect);
    }

    // Conditional update guarantees idempotency against double-submit
    const { data: updatedCard, error: updateErr } = await supabase
      .from("game_cards")
      .update({
        status: nextStatus,
        guessed_card_id: guessedCardId,
        points,
        answered_at: new Date().toISOString(),
      })
      .eq("id", currentCard.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateErr) {
      if (updateErr.code === "23505") {
        return NextResponse.json({ error: "name_already_used" }, { status: 409 });
      }
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!updatedCard) {
      return NextResponse.json({ error: "already_answered" }, { status: 409 });
    }

    const remainingCount = allCards.filter(
      (c) => c.status === "pending" && c.id !== currentCard.id
    ).length;

    let finished = false;
    if (remainingCount === 0) {
      finished = true;
      const totalPoints = allCards.reduce(
        (sum, c) => sum + (c.id === currentCard.id ? points : (c.points ?? 0)),
        0
      );
      const maxPoints = 3 * allCards.length;
      const percent = calculatePercent(totalPoints, allCards.length);

      await supabase
        .from("game_sessions")
        .update({
          status: "finished",
          total_points: totalPoints,
          max_points: maxPoints,
          percent,
          finished_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    return NextResponse.json({ ok: true, finished });
  } catch (err) {
    console.error("Answer card error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
