import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getServerSupabase } from "./supabase";
import { normalizeName } from "../normalize";

export const SESSION_COOKIE_NAME = "kapsul_session";
export const CLAIM_COOKIE_NAME = "kapsul_claim";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  avatarId?: string | null;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Creates a new session in DB and sets the HttpOnly session cookie.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ONE_YEAR_SECONDS * 1000).toISOString();

  const supabase = getServerSupabase();
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions(ONE_YEAR_SECONDS));
}

/**
 * Deletes the current session from DB and clears the cookie.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = getServerSupabase();
    await supabase.from("sessions").delete().eq("token_hash", hashToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Resolves the currently authenticated user from the session cookie.
 * Refreshes the session if less than 6 months remain.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = getServerSupabase();
  const tokenHash = hashToken(token);
  const nowIso = new Date().toISOString();

  let { data: sessionRow, error } = await supabase
    .from("sessions")
    .select("id, expires_at, users ( id, username, full_name, avatar_id )")
    .eq("token_hash", tokenHash)
    .gt("expires_at", nowIso)
    .single();

  if (error && (error.code === "42703" || error.message?.includes("avatar_id"))) {
    const fallback = await supabase
      .from("sessions")
      .select("id, expires_at, users ( id, username, full_name )")
      .eq("token_hash", tokenHash)
      .gt("expires_at", nowIso)
      .single();
    sessionRow = fallback.data as typeof sessionRow;
    error = fallback.error;
  }

  if (error || !sessionRow) return null;

  const userObj = (Array.isArray(sessionRow.users) ? sessionRow.users[0] : sessionRow.users) as
    | { id: string; username: string; full_name: string; avatar_id?: string | null }
    | undefined;
  if (!userObj) return null;

  const expiresMs = new Date(sessionRow.expires_at).getTime();
  if (expiresMs - Date.now() < SIX_MONTHS_MS) {
    const newExpiresAt = new Date(Date.now() + ONE_YEAR_SECONDS * 1000).toISOString();
    await supabase
      .from("sessions")
      .update({ expires_at: newExpiresAt })
      .eq("id", sessionRow.id);

    try {
      cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions(ONE_YEAR_SECONDS));
    } catch {
      // Cookie mutation is not allowed in Server Component render; Route Handlers will refresh it
    }
  }

  return {
    id: userObj.id,
    username: userObj.username,
    fullName: userObj.full_name,
    avatarId: userObj.avatar_id ?? null,
  };
}

/**
 * Links any anonymous entries matching the kapsul_claim cookie to the user,
 * optionally syncing updated fullName and avatarId, skipping conflicting rows,
 * and removes the claim cookie.
 */
export async function claimAnonymousEntries(
  userId: string,
  syncProfile?: { fullName?: string; avatarId?: string | null }
): Promise<void> {
  const cookieStore = await cookies();
  const claimToken = cookieStore.get(CLAIM_COOKIE_NAME)?.value;
  if (!claimToken) return;

  const supabase = getServerSupabase();
  const claimHash = hashToken(claimToken);

  const { data: candidates } = await supabase
    .from("entries")
    .select("id, receiver_id")
    .eq("claim_token_hash", claimHash)
    .is("author_user_id", null);

  if (candidates && candidates.length > 0) {
    const baseUpdate: Record<string, unknown> = {
      author_user_id: userId,
      claim_token_hash: null,
    };
    if (syncProfile?.fullName) {
      baseUpdate.author_name = syncProfile.fullName;
      baseUpdate.author_name_norm = normalizeName(syncProfile.fullName);
    }

    for (const entry of candidates) {
      if (entry.receiver_id === userId) continue;
      const withAvatar = syncProfile?.avatarId
        ? { ...baseUpdate, avatar_id: syncProfile.avatarId }
        : baseUpdate;
      // Update one-by-one so unique constraint conflicts are safely skipped
      const { error } = await supabase
        .from("entries")
        .update(withAvatar)
        .eq("id", entry.id)
        .is("author_user_id", null);
      if (error && (error.code === "42703" || error.message?.includes("avatar_id"))) {
        await supabase
          .from("entries")
          .update(baseUpdate)
          .eq("id", entry.id)
          .is("author_user_id", null);
      }
    }
  }

  cookieStore.delete(CLAIM_COOKIE_NAME);
}
