import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";

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

    // Circle = owners of boxes user wrote to + registered authors who wrote to user's box + user
    const [{ data: sentRows }, { data: receivedRows }] = await Promise.all([
      supabase
        .from("entries")
        .select("receiver_id")
        .eq("author_user_id", user.id)
        .eq("season", season),
      supabase
        .from("entries")
        .select("author_user_id")
        .eq("receiver_id", user.id)
        .eq("season", season)
        .not("author_user_id", "is", null),
    ]);

    const circleIds = new Set<string>([user.id]);
    for (const row of sentRows ?? []) {
      if (row.receiver_id) circleIds.add(row.receiver_id);
    }
    for (const row of receivedRows ?? []) {
      if (row.author_user_id) circleIds.add(row.author_user_id);
    }

    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("owner_id, percent, share_in_circle, users!game_sessions_owner_id_fkey ( full_name )")
      .eq("season", season)
      .eq("mode", "game")
      .eq("status", "finished")
      .in("owner_id", Array.from(circleIds));

    const entries = (sessions ?? [])
      .filter((s) => s.share_in_circle || s.owner_id === user.id)
      .map((s) => {
        const owner = Array.isArray(s.users) ? s.users[0] : s.users;
        return {
          fullName: owner?.full_name ?? "",
          percent: Number(s.percent ?? 0),
          isSelf: s.owner_id === user.id,
        };
      })
      .sort((a, b) => b.percent - a.percent || a.fullName.localeCompare(b.fullName, "tr"));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("Circle leaderboard error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
