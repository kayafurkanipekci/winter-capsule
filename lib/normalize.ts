const RESERVED_USERNAMES = new Set([
  "login",
  "create",
  "dashboard",
  "api",
  "_next",
  "_surprise",
  "favicon.ico",
  "robots.txt",
]);

const TURKISH_CHAR_MAP: Record<string, string> = {
  "\u0131": "i", // dotless i
  "\u015f": "s", // s-cedilla
  "\u011f": "g", // g-breve
  "\u00fc": "u", // u-umlaut
  "\u00f6": "o", // o-umlaut
  "\u00e7": "c", // c-cedilla
};

/**
 * Normalizes a name or username for case/diacritic-insensitive comparison.
 */
export function normalizeName(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, " ");
  const lowered = collapsed.toLocaleLowerCase("tr-TR");
  const mapped = lowered.replace(/[\u0131\u015f\u011f\u00fc\u00f6\u00e7]/g, (ch) => TURKISH_CHAR_MAP[ch] ?? ch);
  return mapped.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Collapses extra whitespace and trims a display name.
 */
export function cleanDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export type UsernameValidationResult =
  | { ok: true; username: string; usernameNorm: string }
  | { ok: false; error: "username_has_spaces" | "username_invalid" | "username_reserved" };

export function validateUsername(raw: string): UsernameValidationResult {
  const trimmed = raw.trim();
  if (/\s/.test(trimmed)) {
    return { ok: false, error: "username_has_spaces" };
  }

  const norm = normalizeName(trimmed);
  if (norm.length < 3 || norm.length > 24 || !/^[a-z0-9._-]+$/.test(norm)) {
    return { ok: false, error: "username_invalid" };
  }

  if (RESERVED_USERNAMES.has(norm)) {
    return { ok: false, error: "username_reserved" };
  }

  return { ok: true, username: trimmed, usernameNorm: norm };
}

export type FullNameValidationResult =
  | { ok: true; fullName: string; fullNameNorm: string }
  | { ok: false; error: "full_name_invalid" };

export function validateFullName(raw: string): FullNameValidationResult {
  const cleaned = cleanDisplayName(raw);
  if (cleaned.length === 0 || cleaned.length > 60) {
    return { ok: false, error: "full_name_invalid" };
  }

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length < 2) {
    return { ok: false, error: "full_name_invalid" };
  }

  return { ok: true, fullName: cleaned, fullNameNorm: normalizeName(cleaned) };
}

export function validatePin(raw: string): boolean {
  return /^[0-9]{4}$/.test(raw);
}
