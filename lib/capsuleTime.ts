const UNLOCK_MONTH_CUTOFF = 8; // September (0-indexed): Sep-Dec target next Jan 1; Jan-Aug stay unlocked for current year

/**
 * Returns the active New Year target year for the capsule.
 * From September through December, targets the upcoming Jan 1 (year + 1).
 * From January through August, targets the current year's Jan 1 (already unlocked).
 */
export function getTargetYear(now: Date = new Date()): number {
  const year = now.getFullYear();
  return now.getMonth() >= UNLOCK_MONTH_CUTOFF ? year + 1 : year;
}

/**
 * Returns the unlock Date (Jan 1, 00:00:00 local time) for the active capsule cycle.
 */
export function getTargetDate(now: Date = new Date()): Date {
  return new Date(getTargetYear(now), 0, 1, 0, 0, 0);
}

/**
 * Returns the Turkish dative suffix (-a/-e/-ya/-ye) for a 4-digit year (e.g. 2027 -> "'ye").
 */
export function getYearDativeSuffix(year: number): string {
  const lastTwo = year % 100;
  const lastDigit = year % 10;

  // Numbers ending in 0 use the tens digit for vowel harmony
  if (lastDigit === 0) {
    const tensMap: Record<number, string> = {
      0: "'a",   // 2000 -> iki bin'e? Wait: 2100, 2000 ("bin'e")
      10: "'a",  // on'a
      20: "'ye", // yirmi'ye
      30: "'a",  // otuz'a
      40: "'a",  // kırk'a
      50: "'ye", // elli'ye
      60: "'a",  // altmış'a
      70: "'e",  // yetmiş'e
      80: "'e",  // seksen'e
      90: "'a",  // doksan'a
    };
    if (lastTwo === 0) return "'e"; // 2000 ("iki bin'e")
    return tensMap[lastTwo] ?? "'a";
  }

  const digitMap: Record<number, string> = {
    1: "'e",  // bir'e
    2: "'ye", // iki'ye
    3: "'e",  // üç'e
    4: "'e",  // dört'e -> dörd'e
    5: "'e",  // beş'e
    6: "'ya", // altı'ya
    7: "'ye", // yedi'ye
    8: "'e",  // sekiz'e
    9: "'a",  // dokuz'a
  };

  return digitMap[lastDigit] ?? "'a";
}

/**
 * Returns the Turkish locative suffix (-da/-de) for a 4-digit year (e.g. 2027 -> "'de").
 */
export function getYearLocativeSuffix(year: number): string {
  const lastTwo = year % 100;
  const lastDigit = year % 10;

  if (lastDigit === 0) {
    if (lastTwo === 0) return "'de"; // iki bin'de
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
