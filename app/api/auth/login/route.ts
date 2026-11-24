import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/supabase";
import { claimAnonymousEntries, createSession } from "@/lib/server/auth";
import { normalizeName, validatePin } from "@/lib/normalize";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const usernameNorm = normalizeName(String(body.username ?? ""));
    const pin = String(body.pin ?? "");

    if (!usernameNorm) {
      return NextResponse.json({ error: "username_invalid" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, full_name, pin")
      .eq("username_norm", usernameNorm)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (!validatePin(pin) || user.pin !== pin) {
      return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
    }

    await createSession(user.id);
    await claimAnonymousEntries(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
