import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getServerSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const avatarId = typeof body?.avatarId === "string" ? body.avatarId.trim() : "";
    if (!avatarId || avatarId.length > 64) {
      return NextResponse.json({ error: "invalid_avatar" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("users")
      .update({ avatar_id: avatarId })
      .eq("id", user.id);

    if (error) {
      console.error("Update avatar error:", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // Keep authored entries in sync with updated avatar (ignore if column missing)
    await supabase
      .from("entries")
      .update({ avatar_id: avatarId })
      .eq("author_user_id", user.id);

    return NextResponse.json({ ok: true, avatarId });
  } catch (err) {
    console.error("Avatar PATCH error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
