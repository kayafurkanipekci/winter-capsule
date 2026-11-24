import "server-only";
import crypto from "crypto";
import { getPhotoBucket, getServerSupabase } from "./supabase";

export type ClueType = "text" | "extra" | "extra2" | "photo";

export function parseExtraClues(raw: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      }
    } catch {
      // Treat as plain text if not valid JSON
    }
  }
  return [raw];
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildClueOrder(entry: {
  clue_text: string;
  clue_extra: string | null;
  clue_photo_path: string | null;
}): ClueType[] {
  const available: ClueType[] = ["text"];
  const extras = parseExtraClues(entry.clue_extra);
  if (extras.length >= 1) available.push("extra");
  if (extras.length >= 2) available.push("extra2");
  if (entry.clue_photo_path) available.push("photo");
  return shuffleArray(available);
}

export function calculateCardPoints(
  status: "guessed" | "passed",
  revealedCount: number,
  isCorrect: boolean
): number {
  if (status === "passed") return -1;
  if (!isCorrect) return -3;
  if (revealedCount <= 1) return 3;
  if (revealedCount === 2) return 2;
  return 1;
}

export function calculatePercent(totalPoints: number, cardCount: number): number {
  if (cardCount <= 0) return 0;
  const maxPoints = 3 * cardCount;
  return Number(((Math.max(0, totalPoints) / maxPoints) * 100).toFixed(1));
}

export async function createSignedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = getServerSupabase();
  const bucket = getPhotoBucket();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return null;
  }
  return data.signedUrl;
}
