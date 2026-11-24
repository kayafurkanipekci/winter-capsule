import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/supabase";
import { claimAnonymousEntries, createSession } from "@/lib/server/auth";
import { validateFullName, validatePin, validateUsername } from "@/lib/normalize";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const fullNameCheck = validateFullName(String(body.fullName ?? ""));
    if (!fullNameCheck.ok) {
      return NextResponse.json({ error: fullNameCheck.error }, { status: 400 });
    }

    const usernameCheck = validateUsername(String(body.username ?? ""));
    if (!usernameCheck.ok) {
      return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
    }

    const pin = String(body.pin ?? "");
    if (!validatePin(pin)) {
      return NextResponse.json({ error: "pin_invalid" }, { status: 400 });
    }

    const showWrongGuess = Boolean(body.showWrongGuess);

    const supabase = getServerSupabase();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username_norm", usernameCheck.usernameNorm)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }

    let created: { id: string; username: string; full_name: string } | null = null;
    const { data: insertedWithFlag, error: insertError } = await supabase
      .from("users")
      .insert({
        username: usernameCheck.username,
        username_norm: usernameCheck.usernameNorm,
        pin,
        full_name: fullNameCheck.fullName,
        show_wrong_guess: showWrongGuess,
      })
      .select("id, username, full_name")
      .single();

    if (insertError) {
      // Fallback if show_wrong_guess column has not been added to users yet
      if (insertError.code === "42703" || insertError.message?.includes("show_wrong_guess")) {
        const { data: fallbackCreated, error: fallbackErr } = await supabase
          .from("users")
          .insert({
            username: usernameCheck.username,
            username_norm: usernameCheck.usernameNorm,
            pin,
            full_name: fullNameCheck.fullName,
          })
          .select("id, username, full_name")
          .single();
        if (fallbackErr || !fallbackCreated) {
          if (fallbackErr?.code === "23505") {
            return NextResponse.json({ error: "username_taken" }, { status: 409 });
          }
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }
        created = fallbackCreated;
      } else if (insertError.code === "23505") {
        return NextResponse.json({ error: "username_taken" }, { status: 409 });
      } else {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
    } else {
      created = insertedWithFlag;
    }

    if (!created) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    await createSession(created.id);
    await claimAnonymousEntries(created.id);

    return NextResponse.json(
      {
        user: {
          id: created.id,
          username: created.username,
          fullName: created.full_name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
