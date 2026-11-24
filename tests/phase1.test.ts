import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeName,
  validateFullName,
  validatePin,
  validateUsername,
} from "../lib/normalize.ts";
import {
  getActiveSeason,
  getUnlockInstant,
  isSeasonUnlocked,
} from "../lib/capsuleTime.ts";

test("normalizeName handles Turkish characters and whitespace", () => {
  assert.equal(normalizeName("  Şükrü   Çağrı  "), "sukru cagri");
  assert.equal(normalizeName("İPEK  ÖZTÜRK"), "ipek ozturk");
  assert.equal(normalizeName("IĞDIR"), "igdir");
});

test("validateUsername enforces format and reserved names", () => {
  assert.equal(validateUsername("ali veli").ok, false);
  assert.equal(validateUsername("ab").ok, false);
  assert.equal(validateUsername("login").ok, false);
  assert.equal(validateUsername("_surprise").ok, false);
  const valid = validateUsername("Furkan.Kaya_99");
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.usernameNorm, "furkan.kaya_99");
  }
});

test("validateFullName requires at least two words and max 60 chars", () => {
  assert.equal(validateFullName("Furkan").ok, false);
  assert.equal(validateFullName("a ".repeat(35)).ok, false);
  const valid = validateFullName("  Furkan   İpekçi  ");
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.fullName, "Furkan İpekçi");
    assert.equal(valid.fullNameNorm, "furkan ipekci");
  }
});

test("validatePin requires exactly 4 digits", () => {
  assert.equal(validatePin("1234"), true);
  assert.equal(validatePin("123"), false);
  assert.equal(validatePin("12a4"), false);
});

test("getActiveSeason and isSeasonUnlocked respect Europe/Istanbul boundary", () => {
  // Nov 24 2026 -> season 2027, locked
  const nov = new Date("2026-11-24T12:00:00+03:00");
  assert.equal(getActiveSeason(nov), 2027);
  assert.equal(isSeasonUnlocked(2027, nov), false);

  // Dec 31 2026 23:59:59 Istanbul -> still locked
  const justBefore = new Date("2026-12-31T23:59:59+03:00");
  assert.equal(isSeasonUnlocked(2027, justBefore), false);

  // Jan 1 2027 00:00:00 Istanbul -> unlocked!
  const unlock = new Date("2027-01-01T00:00:00+03:00");
  assert.equal(getUnlockInstant(2027).getTime(), unlock.getTime());
  assert.equal(getActiveSeason(unlock), 2027);
  assert.equal(isSeasonUnlocked(2027, unlock), true);

  // Aug 31 2027 -> still season 2027, unlocked
  const aug = new Date("2027-08-31T23:59:59+03:00");
  assert.equal(getActiveSeason(aug), 2027);
  assert.equal(isSeasonUnlocked(2027, aug), true);

  // Sep 1 2027 -> season 2028, locked
  const sep = new Date("2027-09-01T00:00:00+03:00");
  assert.equal(getActiveSeason(sep), 2028);
  assert.equal(isSeasonUnlocked(2028, sep), false);
});
