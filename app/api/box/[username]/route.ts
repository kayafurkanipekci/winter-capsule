import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/supabase";
import { getCurrentUser } from "@/lib/server/auth";
import { getActiveSeason } from "@/lib/capsuleTime";
import { normalizeName } from "@/lib/normalize";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username: rawUsername } = await context.params;
    const decoded = decodeURIComponent(rawUsername);
    const usernameNorm = normalizeName(decoded);

    if (!usernameNorm) {
      return NextResponse.json({ error: "box_not_found" }, { status: 404 });
    }

    const supabase = getServerSupabase();
    const { data: boxOwner, error } = await supabase
      .from("users")
      .select("id, username, full_name")
      .eq("username_norm", usernameNorm)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!boxOwner) {
      return NextResponse.json({ error: "box_not_found" }, { status: 404 });
    }

    const activeSeason = getActiveSeason();
    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.id === boxOwner.id;

    const { data: openedSession } = await supabase
      .from("game_sessions")
      .select("id")
      .eq("owner_id", boxOwner.id)
      .eq("season", activeSeason)
      .maybeSingle();

    const acceptingCards = !openedSession;

    let alreadySubmitted = false;
    if (currentUser && !isOwner) {
      const { data: existingEntry } = await supabase
        .from("entries")
        .select("id")
        .eq("receiver_id", boxOwner.id)
        .eq("season", activeSeason)
        .eq("author_user_id", currentUser.id)
        .maybeSingle();
      alreadySubmitted = Boolean(existingEntry);
    }

    return NextResponse.json({
      box: {
        username: boxOwner.username,
        fullName: boxOwner.full_name,
      },
      season: activeSeason,
      acceptingCards,
      isOwner,
      alreadySubmitted,
      viewer: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName,
          }
        : null,
    });
  } catch (err) {
    console.error("Box lookup error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
