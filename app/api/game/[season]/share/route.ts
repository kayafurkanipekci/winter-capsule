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
    const shareInCircle = Boolean(body?.shareInCircle);

    const supabase = getServerSupabase();
    const { data: updated, error } = await supabase
      .from("game_sessions")
      .update({ share_in_circle: shareInCircle })
      .eq("owner_id", user.id)
      .eq("season", season)
      .eq("mode", "game")
      .eq("status", "finished")
      .select("share_in_circle")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, shareInCircle: updated.share_in_circle });
  } catch (err) {
    console.error("Share toggle error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
