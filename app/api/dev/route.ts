import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/supabase";
import { createSession, getCurrentUser } from "@/lib/server/auth";
import { getActiveSeason, getNow, isSeasonUnlocked } from "@/lib/capsuleTime";
import { buildClueOrder, shuffleArray } from "@/lib/server/game";
import { normalizeName } from "@/lib/normalize";

export const runtime = "nodejs";

function assertDevOnly() {
  return process.env.NODE_ENV !== "production";
}

export async function GET() {
  if (!assertDevOnly()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const supabase = getServerSupabase();
    const now = getNow();
    const activeSeason = getActiveSeason(now);
    const currentUser = await getCurrentUser();

    const [{ data: users }, { data: entries }, { data: sessions }] = await Promise.all([
      supabase
        .from("users")
        .select("id, username, full_name, pin, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("entries")
        .select("id, receiver_id, season, author_name, clue_text, clue_extra, clue_photo_path, note, created_at")
        .eq("season", activeSeason)
        .order("created_at", { ascending: false }),
      supabase
        .from("game_sessions")
        .select("id, owner_id, season, mode, status, total_points, percent")
        .eq("season", activeSeason),
    ]);

    const countByReceiver = new Map<string, number>();
    for (const e of entries ?? []) {
      countByReceiver.set(e.receiver_id, (countByReceiver.get(e.receiver_id) ?? 0) + 1);
    }

    const sessionByOwner = new Map<string, NonNullable<typeof sessions>[number]>();
    for (const s of sessions ?? []) {
      sessionByOwner.set(s.owner_id, s);
    }

    const userNameById = new Map<string, string>();
    for (const u of users ?? []) {
      userNameById.set(u.id, u.full_name);
    }

    return NextResponse.json({
      activeSeason,
      serverNow: now.toISOString(),
      isSeasonUnlocked: isSeasonUnlocked(activeSeason, now),
      currentUser,
      users: (users ?? []).map((u) => {
        const s = sessionByOwner.get(u.id);
        return {
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          pin: u.pin,
          cardCount: countByReceiver.get(u.id) ?? 0,
          gameStatus: s ? `${s.mode}:${s.status}` : "collecting",
          percent: s?.percent ?? null,
        };
      }),
      entries: (entries ?? []).map((e) => ({
        id: e.id,
        receiverName: userNameById.get(e.receiver_id) ?? e.receiver_id,
        authorName: e.author_name,
        clueText: e.clue_text,
        hasPhoto: Boolean(e.clue_photo_path),
        hasNote: Boolean(e.note),
        createdAt: e.created_at,
      })),
    });
  } catch (err) {
    console.error("Dev GET error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!assertDevOnly()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const action = String(body?.action ?? "");
    const userId = String(body?.userId ?? "");
    const supabase = getServerSupabase();
    const activeSeason = Number(body?.season ?? getActiveSeason());

    if (!userId) {
      return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
    }

    const { data: targetUser } = await supabase
      .from("users")
      .select("id, username, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (action === "impersonate") {
      await createSession(targetUser.id);
      return NextResponse.json({ ok: true, username: targetUser.username });
    }

    if (action === "reset_game") {
      await supabase
        .from("game_sessions")
        .delete()
        .eq("owner_id", targetUser.id)
        .eq("season", activeSeason);
      return NextResponse.json({ ok: true });
    }

    if (action === "seed_cards") {
      const demoAuthors = [
        {
          authorName: "Jane Smith",
          clueText: "I always order iced americano even in January.",
          clueExtra: "We went to the same high school.",
          note: "Happy New Year! Hope this year brings you peace.",
        },
        {
          authorName: "Bob Martin",
          clueText: "I once lost my keys during our road trip.",
          clueExtra: "I play guitar on weekends.",
          note: "Wishing you an amazing 2027!",
        },
        {
          authorName: "Alice Brown",
          clueText: "My cat appears in almost every group call.",
          clueExtra: "I live two streets away from you.",
          note: "Let's grab coffee soon!",
        },
        {
          authorName: "Charlie Davis",
          clueText: "I'm the one who always brings board games.",
          clueExtra: null,
          note: "Cheers to new adventures!",
        },
      ];

      for (const demo of demoAuthors) {
        await supabase.from("entries").upsert(
          {
            receiver_id: targetUser.id,
            season: activeSeason,
            author_name: demo.authorName,
            author_name_norm: normalizeName(demo.authorName),
            clue_text: demo.clueText,
            clue_extra: demo.clueExtra,
            note: demo.note,
            show_wrong_guess: false,
          },
          { onConflict: "receiver_id,season,author_name_norm", ignoreDuplicates: true }
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "open_box") {
      await createSession(targetUser.id);

      const { data: existingSession } = await supabase
        .from("game_sessions")
        .select("id, mode, status")
        .eq("owner_id", targetUser.id)
        .eq("season", activeSeason)
        .maybeSingle();

      if (existingSession) {
        return NextResponse.json({
          ok: true,
          username: targetUser.username,
          season: activeSeason,
        });
      }

      const { data: entries } = await supabase
        .from("entries")
        .select("id, clue_text, clue_extra, clue_photo_path")
        .eq("receiver_id", targetUser.id)
        .eq("season", activeSeason);

      const list = entries ?? [];
      if (list.length < 4) {
        await supabase.from("game_sessions").insert({
          owner_id: targetUser.id,
          season: activeSeason,
          mode: "classic",
          status: "finished",
          finished_at: new Date().toISOString(),
        });
      } else {
        const { data: session, error: sessionErr } = await supabase
          .from("game_sessions")
          .insert({
            owner_id: targetUser.id,
            season: activeSeason,
            mode: "game",
            status: "in_progress",
          })
          .select("id")
          .single();

        if (sessionErr || !session) {
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }

        const shuffled = shuffleArray(list);
        await supabase.from("game_cards").insert(
          shuffled.map((entry, idx) => ({
            session_id: session.id,
            entry_id: entry.id,
            position: idx,
            clue_order: buildClueOrder(entry),
            revealed_count: 1,
            status: "pending",
          }))
        );
      }

      return NextResponse.json({
        ok: true,
        username: targetUser.username,
        season: activeSeason,
      });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    console.error("Dev POST error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
