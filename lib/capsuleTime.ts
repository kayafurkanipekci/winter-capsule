const UNLOCK_MONTH_CUTOFF = 8; // September (0-indexed): Sep-Dec target next Jan 1; Jan-Aug stay unlocked for current year

/**
 * Returns the current Date, honoring CAPSULE_NOW_OVERRIDE outside production.
 */
export function getNow(): Date {
  if (process.env.NODE_ENV !== "production" && process.env.CAPSULE_NOW_OVERRIDE) {
    const parsed = new Date(process.env.CAPSULE_NOW_OVERRIDE);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

/**
 * Extracts year and 0-indexed month in Europe/Istanbul (UTC+3).
 */
function getIstanbulYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.CAPSULE_TZ || "Europe/Istanbul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value ?? now.getUTCFullYear());
  const month = Number(parts.find((p) => p.type === "month")?.value ?? now.getUTCMonth() + 1) - 1;
  return { year, month };
}

/**
 * Returns the active season year.
 * Sep-Dec -> year + 1 (locked until Jan 1).
 * Jan-Aug -> year (unlocked).
 */
export function getActiveSeason(now: Date = getNow()): number {
  const { year, month } = getIstanbulYearMonth(now);
  return month >= UNLOCK_MONTH_CUTOFF ? year + 1 : year;
}

/**
 * Returns the unlock instant for a given season: Jan 1 00:00:00 Europe/Istanbul (UTC+3).
 */
export function getUnlockInstant(season: number): Date {
  return new Date(`${season}-01-01T00:00:00+03:00`);
}

/**
 * Returns true if the given season has reached its unlock instant.
 */
export function isSeasonUnlocked(season: number, now: Date = getNow()): boolean {
  return now.getTime() >= getUnlockInstant(season).getTime();
}

// Legacy aliases kept for shared UI helpers
export function getTargetYear(now: Date = new Date()): number {
  return getActiveSeason(now);
}

export function getTargetDate(now: Date = new Date()): Date {
  return getUnlockInstant(getActiveSeason(now));
}

/**
 * Returns the Turkish dative suffix (-a/-e/-ya/-ye) for a 4-digit year.
 */
export function getYearDativeSuffix(year: number): string {
  const lastTwo = year % 100;
  const lastDigit = year % 10;

  if (lastDigit === 0) {
    const tensMap: Record<number, string> = {
      10: "'a",
      20: "'ye",
      30: "'a",
      40: "'a",
      50: "'ye",
      60: "'a",
      70: "'e",
      80: "'e",
      90: "'a",
    };
    if (lastTwo === 0) return "'e";
    return tensMap[lastTwo] ?? "'a";
  }

  const digitMap: Record<number, string> = {
    1: "'e",
    2: "'ye",
    3: "'e",
    4: "'e",
    5: "'e",
    6: "'ya",
    7: "'ye",
    8: "'e",
    9: "'a",
  };

  return digitMap[lastDigit] ?? "'a";
}

/**
 * Returns the Turkish locative suffix (-da/-de/-ta/-te) for a 4-digit year.
 */
export function getYearLocativeSuffix(year: number): string {
  const lastTwo = year % 100;
  const lastDigit = year % 10;

  if (lastDigit === 0) {
    if (lastTwo === 0) return "'de";
    const tensMap: Record<number, string> = {
      10: "'da",
      20: "'de",
      30: "'da",
      40: "'ta",
      50: "'de",
      60: "'ta",
      70: "'te",
      80: "'de",
      90: "'da",
    };
    return tensMap[lastTwo] ?? "'da";
  }

  const digitMap: Record<number, string> = {
    1: "'de",
    2: "'de",
    3: "'te",
    4: "'te",
    5: "'te",
    6: "'da",
    7: "'de",
    8: "'de",
    9: "'da",
  };

  return digitMap[lastDigit] ?? "'da";
}
