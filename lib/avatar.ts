export type AvatarBody = "male" | "female";

export type AvatarHairId =
  | "none"
  | "short"
  | "spiky"
  | "side_part"
  | "curly"
  | "bob"
  | "long"
  | "ponytail"
  | "twin_buns"
  | "wavy";

export type AvatarHairColorId =
  | "black"
  | "dark_brown"
  | "chestnut"
  | "blonde"
  | "ginger"
  | "silver"
  | "pine"
  | "violet";

export type AvatarEyeColorId =
  | "black"
  | "brown"
  | "hazel"
  | "blue"
  | "green"
  | "gray"
  | "violet";

export type AvatarFacialHairId =
  | "none"
  | "stubble"
  | "mustache"
  | "goatee"
  | "full_beard"
  | "santa_beard";

export type AvatarGlassesId =
  | "none"
  | "round"
  | "square"
  | "sunglasses"
  | "gold_rim"
  | "festive_red";

export type AvatarHatId =
  | "none"
  | "santa"
  | "beanie_red"
  | "beanie_green"
  | "reindeer"
  | "crown"
  | "cap"
  | "ushanka";

export type AvatarTopId =
  | "winter_red"
  | "winter_green"
  | "hoodie_navy"
  | "jacket_brown"
  | "scarf_cream"
  | "suit"
  | "turtleneck"
  | "cardigan";

export type AvatarBottomId =
  | "jeans"
  | "dark_pants"
  | "chinos"
  | "joggers"
  | "skirt_red"
  | "skirt_dark";

export type AvatarShoesId =
  | "sneakers"
  | "winter_boots"
  | "dark_boots"
  | "brown_loafers"
  | "elf_shoes"
  | "ice_skates";

export interface AvatarConfig {
  body: AvatarBody;
  /** Continuous skin tone index from 0 (lightest) to 20 (deepest) */
  skin: number;
  eyeColor: AvatarEyeColorId;
  hair: AvatarHairId;
  hairColor: AvatarHairColorId;
  facialHair: AvatarFacialHairId;
  facialHairColor: AvatarHairColorId;
  glasses: AvatarGlassesId;
  hat: AvatarHatId;
  top: AvatarTopId;
  bottom: AvatarBottomId;
  shoes: AvatarShoesId;
}

export interface PaletteTone {
  id: string;
  label: string;
  base: string;
  light: string;
  dark: string;
  blush?: string;
}

export interface AvatarOption<T extends string> {
  id: T;
  label: string;
  swatch?: string;
}

export const SKIN_MIN = 0;
export const SKIN_MAX = 20;

const SKIN_STOPS = [
  { r: 253, g: 226, b: 210 }, // 0
  { r: 245, g: 207, b: 168 }, // 1
  { r: 226, g: 177, b: 132 }, // 2
  { r: 198, g: 139, b: 89 },  // 3
  { r: 141, g: 85, b: 36 },   // 4
  { r: 92, g: 56, b: 34 },    // 5
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toHex(r: number, g: number, b: number) {
  const h = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Computes base, highlight, shadow, and blush colors for any skin slider value (0..20).
 */
export function getSkinTone(skinValue: number) {
  const t = clamp(skinValue, SKIN_MIN, SKIN_MAX) / SKIN_MAX;
  const scaled = t * (SKIN_STOPS.length - 1);
  const idx = Math.min(SKIN_STOPS.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const a = SKIN_STOPS[idx];
  const b = SKIN_STOPS[idx + 1];

  const r = a.r + (b.r - a.r) * frac;
  const g = a.g + (b.g - a.g) * frac;
  const bl = a.b + (b.b - a.b) * frac;

  return {
    base: toHex(r, g, bl),
    light: toHex(r + 18, g + 16, bl + 14),
    dark: toHex(r - 32, g - 34, bl - 32),
    blush: toHex(Math.min(255, r + 10), g - 38, bl - 32),
  };
}

export const AVATAR_BODIES: AvatarOption<AvatarBody>[] = [
  { id: "male", label: "Erkek" },
  { id: "female", label: "Kadın" },
];

export const AVATAR_EYE_COLORS: { id: AvatarEyeColorId; label: string; color: string }[] = [
  { id: "black", label: "Siyah", color: "#1c1917" },
  { id: "brown", label: "Kahve", color: "#5c3317" },
  { id: "hazel", label: "Ela", color: "#926c24" },
  { id: "blue", label: "Mavi", color: "#2563eb" },
  { id: "green", label: "Yeşil", color: "#15803d" },
  { id: "gray", label: "Gri", color: "#64748b" },
  { id: "violet", label: "Mor", color: "#7c3aed" },
];

export const AVATAR_HAIRS: AvatarOption<AvatarHairId>[] = [
  { id: "none", label: "Saçsız" },
  { id: "short", label: "Kısa" },
  { id: "spiky", label: "Dağınık" },
  { id: "side_part", label: "Yana Ayrık" },
  { id: "curly", label: "Kıvırcık" },
  { id: "bob", label: "Küt" },
  { id: "long", label: "Uzun Düz" },
  { id: "ponytail", label: "At Kuyruğu" },
  { id: "twin_buns", label: "İki Topuz" },
  { id: "wavy", label: "Dalgalı" },
];

export const AVATAR_HAIR_COLORS: (PaletteTone & { id: AvatarHairColorId })[] = [
  { id: "black", label: "Siyah", base: "#222026", light: "#3d3945", dark: "#110f14" },
  { id: "dark_brown", label: "Koyu Kahve", base: "#4a2c1d", light: "#69412c", dark: "#2e1a10" },
  { id: "chestnut", label: "Kestane", base: "#824324", light: "#a65c37", dark: "#592b14" },
  { id: "blonde", label: "Sarı", base: "#e6b84c", light: "#fae078", dark: "#b88628" },
  { id: "ginger", label: "Kızıl", base: "#c94a1a", light: "#e86a38", dark: "#8c2c0b" },
  { id: "silver", label: "Gümüş", base: "#cbd5e1", light: "#f1f5f9", dark: "#94a3b8" },
  { id: "pine", label: "Çam Yeşili", base: "#15803d", light: "#22c55e", dark: "#14532d" },
  { id: "violet", label: "Mor", base: "#7c3aed", light: "#a78bfa", dark: "#4c1d95" },
];

export const AVATAR_FACIAL_HAIRS: AvatarOption<AvatarFacialHairId>[] = [
  { id: "none", label: "Yok" },
  { id: "stubble", label: "Kirli Sakal" },
  { id: "mustache", label: "Bıyık" },
  { id: "goatee", label: "Keçi Sakalı" },
  { id: "full_beard", label: "Tam Sakal" },
  { id: "santa_beard", label: "Gür Kış Sakalı" },
];

export const AVATAR_GLASSES: AvatarOption<AvatarGlassesId>[] = [
  { id: "none", label: "Yok" },
  { id: "round", label: "Yuvarlak" },
  { id: "square", label: "Kare" },
  { id: "sunglasses", label: "Güneş" },
  { id: "gold_rim", label: "Altın" },
  { id: "festive_red", label: "Yılbaşı" },
];

export const AVATAR_HATS: AvatarOption<AvatarHatId>[] = [
  { id: "none", label: "Yok" },
  { id: "santa", label: "Noel Baba" },
  { id: "beanie_red", label: "Kırmızı Bere" },
  { id: "beanie_green", label: "Yeşil Bere" },
  { id: "reindeer", label: "Geyik Boynuzu" },
  { id: "crown", label: "Taç" },
  { id: "cap", label: "Kep" },
  { id: "ushanka", label: "Kürklü Şapka" },
];

export const AVATAR_TOPS: AvatarOption<AvatarTopId>[] = [
  { id: "winter_red", label: "Yılbaşı Kazağı", swatch: "#b91c1c" },
  { id: "winter_green", label: "Çam Kazağı", swatch: "#15803d" },
  { id: "hoodie_navy", label: "Kapüşonlu", swatch: "#1e3a8a" },
  { id: "jacket_brown", label: "Kışlık Mont", swatch: "#78350f" },
  { id: "scarf_cream", label: "Atkılı Kazak", swatch: "#fef3c7" },
  { id: "suit", label: "Takım Ceket", swatch: "#1f2937" },
  { id: "turtleneck", label: "Bordo Boğazlı", swatch: "#881337" },
  { id: "cardigan", label: "Hardal Hırka", swatch: "#d97706" },
];

export const AVATAR_BOTTOMS: AvatarOption<AvatarBottomId>[] = [
  { id: "jeans", label: "Kot Pantolon", swatch: "#2563eb" },
  { id: "dark_pants", label: "Siyah Pantolon", swatch: "#1f2937" },
  { id: "chinos", label: "Bej Pantolon", swatch: "#d6b88d" },
  { id: "joggers", label: "Gri Eşofman", swatch: "#64748b" },
  { id: "skirt_red", label: "Kırmızı Etek", swatch: "#b91c1c" },
  { id: "skirt_dark", label: "Siyah Etek", swatch: "#27272a" },
];

export const AVATAR_SHOES: AvatarOption<AvatarShoesId>[] = [
  { id: "sneakers", label: "Spor Ayakkabı", swatch: "#f8fafc" },
  { id: "winter_boots", label: "Kar Botu", swatch: "#92400e" },
  { id: "dark_boots", label: "Siyah Bot", swatch: "#18181b" },
  { id: "brown_loafers", label: "Klasik", swatch: "#78350f" },
  { id: "elf_shoes", label: "Yılbaşı Botu", swatch: "#166534" },
  { id: "ice_skates", label: "Buz Pateni", swatch: "#bae6fd" },
];

const EYE_COLOR_IDS = AVATAR_EYE_COLORS.map((o) => o.id);
const HAIR_IDS = AVATAR_HAIRS.map((o) => o.id);
const HAIR_COLOR_IDS = AVATAR_HAIR_COLORS.map((o) => o.id);
const FACIAL_HAIR_IDS = AVATAR_FACIAL_HAIRS.map((o) => o.id);
const GLASSES_IDS = AVATAR_GLASSES.map((o) => o.id);
const HAT_IDS = AVATAR_HATS.map((o) => o.id);
const TOP_IDS = AVATAR_TOPS.map((o) => o.id);
const BOTTOM_IDS = AVATAR_BOTTOMS.map((o) => o.id);
const SHOES_IDS = AVATAR_SHOES.map((o) => o.id);

export const DEFAULT_AVATAR: AvatarConfig = {
  body: "male",
  skin: 5,
  eyeColor: "brown",
  hair: "short",
  hairColor: "dark_brown",
  facialHair: "none",
  facialHairColor: "dark_brown",
  glasses: "none",
  hat: "santa",
  top: "winter_red",
  bottom: "jeans",
  shoes: "winter_boots",
};

/**
 * Encodes an AvatarConfig into a compact, DB-friendly string ID (v3: 13 parts).
 */
export function encodeAvatarId(config: AvatarConfig): string {
  const b = config.body === "female" ? "f" : "m";
  const parts = [
    "v3",
    b,
    clamp(Math.round(config.skin), SKIN_MIN, SKIN_MAX),
    Math.max(0, EYE_COLOR_IDS.indexOf(config.eyeColor)),
    Math.max(0, HAIR_IDS.indexOf(config.hair)),
    Math.max(0, HAIR_COLOR_IDS.indexOf(config.hairColor)),
    config.body === "female" ? 0 : Math.max(0, FACIAL_HAIR_IDS.indexOf(config.facialHair)),
    Math.max(0, HAIR_COLOR_IDS.indexOf(config.facialHairColor ?? config.hairColor)),
    Math.max(0, GLASSES_IDS.indexOf(config.glasses)),
    Math.max(0, HAT_IDS.indexOf(config.hat)),
    Math.max(0, TOP_IDS.indexOf(config.top)),
    Math.max(0, BOTTOM_IDS.indexOf(config.bottom)),
    Math.max(0, SHOES_IDS.indexOf(config.shoes)),
  ];
  return parts.join(":");
}

/**
 * Decodes a compact avatar ID string (v2 or v3) back into an AvatarConfig.
 * Falls back safely to DEFAULT_AVATAR for invalid or missing inputs.
 */
export function decodeAvatarId(id?: string | null): AvatarConfig {
  if (!id || typeof id !== "string") return { ...DEFAULT_AVATAR };
  const parts = id.trim().split(":");
  const isV2 = parts.length === 12 && parts[0] === "v2";
  const isV3 = parts.length === 13 && parts[0] === "v3";
  if (!isV2 && !isV3) return { ...DEFAULT_AVATAR };

  const body: AvatarBody = parts[1] === "f" ? "female" : "male";
  const pick = <T extends string>(arr: T[], raw: string, fallback: T): T => {
    const idx = Number.parseInt(raw, 10);
    return Number.isInteger(idx) && idx >= 0 && idx < arr.length ? arr[idx] : fallback;
  };

  const skinRaw = Number.parseInt(parts[2], 10);
  const skin = Number.isInteger(skinRaw) ? clamp(skinRaw, SKIN_MIN, SKIN_MAX) : DEFAULT_AVATAR.skin;
  const hairColor = pick(HAIR_COLOR_IDS, parts[5], DEFAULT_AVATAR.hairColor);

  const facialHair =
    body === "female"
      ? "none"
      : pick(FACIAL_HAIR_IDS, parts[6], DEFAULT_AVATAR.facialHair);

  const offset = isV3 ? 1 : 0;
  const facialHairColor = isV3
    ? pick(HAIR_COLOR_IDS, parts[7], hairColor)
    : hairColor;

  return {
    body,
    skin,
    eyeColor: pick(EYE_COLOR_IDS, parts[3], DEFAULT_AVATAR.eyeColor),
    hair: pick(HAIR_IDS, parts[4], DEFAULT_AVATAR.hair),
    hairColor,
    facialHair,
    facialHairColor,
    glasses: pick(GLASSES_IDS, parts[7 + offset], DEFAULT_AVATAR.glasses),
    hat: pick(HAT_IDS, parts[8 + offset], DEFAULT_AVATAR.hat),
    top: pick(TOP_IDS, parts[9 + offset], DEFAULT_AVATAR.top),
    bottom: pick(BOTTOM_IDS, parts[10 + offset], DEFAULT_AVATAR.bottom),
    shoes: pick(SHOES_IDS, parts[11 + offset], DEFAULT_AVATAR.shoes),
  };
}

function createSeededRng(seed: string | number): () => number {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a random AvatarConfig. If a seed is provided (e.g. for guests without an account),
 * the output is deterministic for that seed.
 */
export function generateRandomAvatar(seed?: string | number): AvatarConfig {
  const rand = seed !== undefined ? createSeededRng(seed) : Math.random;
  const pickRand = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const body: AvatarBody = rand() < 0.5 ? "male" : "female";

  const maleHairs: AvatarHairId[] = ["short", "spiky", "side_part", "curly", "none"];
  const femaleHairs: AvatarHairId[] = ["bob", "long", "ponytail", "twin_buns", "wavy", "curly"];

  const hair = body === "male" ? pickRand(maleHairs) : pickRand(femaleHairs);
  const facialHair: AvatarFacialHairId =
    body === "male" && rand() < 0.45
      ? pickRand(["stubble", "mustache", "goatee", "full_beard", "santa_beard"])
      : "none";

  const glasses: AvatarGlassesId =
    rand() < 0.35
      ? pickRand(["round", "square", "sunglasses", "gold_rim", "festive_red"])
      : "none";

  const hat: AvatarHatId =
    rand() < 0.55
      ? pickRand(["santa", "beanie_red", "beanie_green", "reindeer", "crown", "cap", "ushanka"])
      : "none";

  const maleBottoms: AvatarBottomId[] = ["jeans", "dark_pants", "chinos", "joggers"];
  const femaleBottoms: AvatarBottomId[] = ["jeans", "dark_pants", "skirt_red", "skirt_dark", "chinos"];

  const hairColor = pickRand(HAIR_COLOR_IDS);
  const facialHairColor = rand() < 0.8 ? hairColor : pickRand(HAIR_COLOR_IDS);

  return {
    body,
    skin: Math.floor(rand() * (SKIN_MAX + 1)),
    eyeColor: pickRand(EYE_COLOR_IDS),
    hair,
    hairColor,
    facialHair,
    facialHairColor,
    glasses,
    hat,
    top: pickRand(TOP_IDS),
    bottom: body === "male" ? pickRand(maleBottoms) : pickRand(femaleBottoms),
    shoes: pickRand(SHOES_IDS),
  };
}

export function getHairTone(id: AvatarHairColorId) {
  return AVATAR_HAIR_COLORS.find((c) => c.id === id) ?? AVATAR_HAIR_COLORS[1];
}

export function getEyeColorHex(id: AvatarEyeColorId): string {
  return AVATAR_EYE_COLORS.find((e) => e.id === id)?.color ?? "#5c3317";
}
