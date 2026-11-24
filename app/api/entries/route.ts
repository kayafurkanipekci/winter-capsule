import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPhotoBucket, getServerSupabase } from "@/lib/server/supabase";
import {
  CLAIM_COOKIE_NAME,
  generateRandomToken,
  getCurrentUser,
  hashToken,
} from "@/lib/server/auth";
import { getActiveSeason } from "@/lib/capsuleTime";
import { normalizeName, validateFullName } from "@/lib/normalize";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isJpegBuffer(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function readAndValidateJpeg(file: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("invalid_image");
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!isJpegBuffer(buffer)) {
    throw new Error("invalid_image");
  }
  return buffer;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const boxUsername = String(formData.get("boxUsername") ?? "").trim();
    const rawAuthorName = String(formData.get("authorName") ?? "");
    const clueText = String(formData.get("clueText") ?? "").trim();
    const clueExtra1 = String(formData.get("clueExtra1") ?? formData.get("clueExtra") ?? "").trim();
    const clueExtra2 = String(formData.get("clueExtra2") ?? "").trim();
    const noteRaw = String(formData.get("note") ?? "").trim();

    let clueExtraStored: string | null = null;
    const extraTexts = [clueExtra1, clueExtra2].filter(Boolean);
    if (extraTexts.length === 1) {
      if (extraTexts[0].length > 200) {
        return NextResponse.json({ error: "clue_extra_invalid" }, { status: 400 });
      }
      clueExtraStored = extraTexts[0];
    } else if (extraTexts.length >= 2) {
      const encoded = JSON.stringify([extraTexts[0].slice(0, 90), extraTexts[1].slice(0, 90)]);
      clueExtraStored = encoded;
    }

    if (!boxUsername) {
      return NextResponse.json({ error: "box_not_found" }, { status: 404 });
    }

    if (clueText.length < 3 || clueText.length > 300) {
      return NextResponse.json({ error: "clue_invalid" }, { status: 400 });
    }
    if (noteRaw.length > 2000) {
      return NextResponse.json({ error: "note_invalid" }, { status: 400 });
    }

    let cluePhotoBuf: Buffer | null = null;
    let notePhotoBuf: Buffer | null = null;
    try {
      cluePhotoBuf = await readAndValidateJpeg(formData.get("cluePhoto"));
      notePhotoBuf = await readAndValidateJpeg(formData.get("notePhoto"));
    } catch {
      return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: boxOwner, error: boxError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username_norm", normalizeName(boxUsername))
      .maybeSingle();

    if (boxError) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!boxOwner) {
      return NextResponse.json({ error: "box_not_found" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === boxOwner.id) {
      return NextResponse.json({ error: "cannot_send_to_self" }, { status: 400 });
    }

    const activeSeason = getActiveSeason();

    const { data: openedSession } = await supabase
      .from("game_sessions")
      .select("id")
      .eq("owner_id", boxOwner.id)
      .eq("season", activeSeason)
      .maybeSingle();

    if (openedSession) {
      return NextResponse.json({ error: "box_already_opened" }, { status: 409 });
    }

    let authorName: string;
    let authorNameNorm: string;
    if (currentUser) {
      authorName = currentUser.fullName;
      authorNameNorm = normalizeName(currentUser.fullName);
    } else {
      const nameCheck = validateFullName(rawAuthorName);
      if (!nameCheck.ok) {
        return NextResponse.json({ error: "full_name_invalid" }, { status: 400 });
      }
      authorName = nameCheck.fullName;
      authorNameNorm = nameCheck.fullNameNorm;
    }

    if (currentUser) {
      const { data: existingUserEntry } = await supabase
        .from("entries")
        .select("id")
        .eq("receiver_id", boxOwner.id)
        .eq("season", activeSeason)
        .eq("author_user_id", currentUser.id)
        .maybeSingle();

      if (existingUserEntry) {
        return NextResponse.json({ error: "already_submitted" }, { status: 409 });
      }
    }

    const { data: existingNameEntry } = await supabase
      .from("entries")
      .select("id")
      .eq("receiver_id", boxOwner.id)
      .eq("season", activeSeason)
      .eq("author_name_norm", authorNameNorm)
      .maybeSingle();

    if (existingNameEntry) {
      return NextResponse.json({ error: "name_taken" }, { status: 409 });
    }

    // Prepare claim token if anonymous
    let newClaimTokenToSet: string | null = null;
    let claimTokenHash: string | null = null;
    if (!currentUser) {
      const cookieStore = await cookies();
      const existingClaim = cookieStore.get(CLAIM_COOKIE_NAME)?.value;
      const rawClaim = existingClaim || generateRandomToken();
      if (!existingClaim) {
        newClaimTokenToSet = rawClaim;
      }
      claimTokenHash = hashToken(rawClaim);
    }

    const entryId = crypto.randomUUID();
    const bucket = getPhotoBucket();
    const uploadedPaths: string[] = [];

    let cluePhotoPath: string | null = null;
    let notePhotoPath: string | null = null;

    if (cluePhotoBuf) {
      const path = `${activeSeason}/${boxOwner.id}/${entryId}/clue.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, cluePhotoBuf, { contentType: "image/jpeg", upsert: false });
      if (uploadErr) {
        console.error("Clue photo upload error:", uploadErr);
        return NextResponse.json({ error: "upload_failed" }, { status: 500 });
      }
      cluePhotoPath = path;
      uploadedPaths.push(path);
    }

    if (notePhotoBuf) {
      const path = `${activeSeason}/${boxOwner.id}/${entryId}/note.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, notePhotoBuf, { contentType: "image/jpeg", upsert: false });
      if (uploadErr) {
        console.error("Note photo upload error:", uploadErr);
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(bucket).remove(uploadedPaths);
        }
        return NextResponse.json({ error: "upload_failed" }, { status: 500 });
      }
      notePhotoPath = path;
      uploadedPaths.push(path);
    }

    const { error: insertErr } = await supabase.from("entries").insert({
      id: entryId,
      receiver_id: boxOwner.id,
      season: activeSeason,
      author_user_id: currentUser ? currentUser.id : null,
      claim_token_hash: claimTokenHash,
      author_name: authorName,
      author_name_norm: authorNameNorm,
      clue_text: clueText,
      clue_extra: clueExtraStored,
      clue_photo_path: cluePhotoPath,
      note: noteRaw || null,
      note_photo_path: notePhotoPath,
      show_wrong_guess: false,
    });

    if (insertErr) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(bucket).remove(uploadedPaths);
      }
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "name_taken" }, { status: 409 });
      }
      console.error("Entry insert error:", insertErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const response = NextResponse.json(
      { ok: true, isAnonymous: !currentUser },
      { status: 201 }
    );

    if (newClaimTokenToSet) {
      response.cookies.set(CLAIM_COOKIE_NAME, newClaimTokenToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
      });
    }

    return response;
  } catch (err) {
    console.error("Create entry error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
