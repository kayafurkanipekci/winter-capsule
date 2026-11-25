"use client";

import React, { useMemo } from "react";
import {
  AvatarConfig,
  decodeAvatarId,
  getEyeColorHex,
  getHairTone,
  getSkinTone,
} from "@/lib/avatar";

export type AvatarCrop = "full" | "head" | "glasses" | "torso" | "legs" | "shoes";

interface PixelAvatarProps {
  /** Either an AvatarConfig object or a compact avatar ID string */
  config?: AvatarConfig | string | null;
  size?: number;
  crop?: AvatarCrop;
  className?: string;
  title?: string;
}

interface RectSpec {
  x: number;
  y: number;
  w?: number;
  h?: number;
  c: string;
  o?: number;
}

const OUTLINE = "#2b1b17";

const VIEWBOX_BY_CROP: Record<AvatarCrop, string> = {
  full: "0 0 32 32",
  head: "6 1 20 18",
  glasses: "8 8 16 8",
  torso: "6 16 20 10",
  legs: "8 22 16 8",
  shoes: "8 25 16 7",
};

/**
 * Renders a crisp 32x32 pixel-art character from an AvatarConfig or compact ID string.
 */
export default function PixelAvatar({
  config,
  size = 64,
  crop = "full",
  className = "",
  title,
}: PixelAvatarProps) {
  const avatar: AvatarConfig = useMemo(() => {
    if (!config) return decodeAvatarId(null);
    if (typeof config === "string") return decodeAvatarId(config);
    return config;
  }, [config]);

  const rects = useMemo(() => {
    const out: RectSpec[] = [];
    const p = (x: number, y: number, c: string, w = 1, h = 1, o = 1) => {
      out.push({ x, y, w, h, c, o });
    };

    const skin = getSkinTone(avatar.skin);
    const hair = getHairTone(avatar.hairColor);
    const beard = getHairTone(avatar.facialHairColor ?? avatar.hairColor);
    const eyeHex = getEyeColorHex(avatar.eyeColor);
    const isFemale = avatar.body === "female";

    // 1. Ground shadow (full view only)
    if (crop === "full") {
      p(11, 30, "#000000", 10, 1, 0.22);
      p(10, 30, "#000000", 1, 1, 0.12);
      p(21, 30, "#000000", 1, 1, 0.12);
    }

    // 2. Back hair layer (behind torso & head)
    if (avatar.hair === "long") {
      p(9, 12, OUTLINE, 14, 11);
      p(10, 12, hair.dark, 12, 10);
      p(10, 14, hair.base, 2, 7);
      p(20, 14, hair.base, 2, 7);
    } else if (avatar.hair === "wavy") {
      p(8, 12, OUTLINE, 16, 11);
      p(9, 12, hair.dark, 14, 10);
      p(9, 15, hair.base, 2, 6);
      p(21, 15, hair.base, 2, 6);
      p(8, 18, hair.light, 1, 3);
      p(23, 18, hair.light, 1, 3);
    } else if (avatar.hair === "bob") {
      p(9, 12, OUTLINE, 14, 6);
      p(10, 12, hair.dark, 12, 5);
    } else if (avatar.hair === "ponytail") {
      p(13, 16, OUTLINE, 6, 7);
      p(14, 16, hair.dark, 4, 6);
      p(15, 17, hair.base, 2, 4);
    }

    // 3. Shoes (y = 26..29)
    const drawShoes = () => {
      if (avatar.shoes === "winter_boots") {
        // Chunky tall snow boots with fluffy cream fur cuff
        for (const sx of [11, 17]) {
          p(sx - 1, 26, OUTLINE, 6, 4);
          p(sx, 26, "#fef3c7", 4, 1); // fur cuff
          p(sx, 27, "#b45309", 4, 1); // tan upper
          p(sx, 27, "#d97706", 2, 1);
          p(sx, 28, "#92400e", 4, 1);
          p(sx, 29, "#27170e", 4, 1); // thick lug sole
        }
        return;
      }

      if (avatar.shoes === "brown_loafers") {
        // Sleek low-profile dress shoes with gold buckle
        for (const sx of [11, 17]) {
          p(sx - 1, 28, OUTLINE, 6, 2);
          p(sx, 28, "#6b2f10", 4, 1);
          p(sx + 1, 28, "#fbbf24", 1, 1); // gold buckle
          p(sx, 29, "#2e1305", 4, 1);
        }
        return;
      }

      if (avatar.shoes === "ice_skates") {
        // White/ice-blue skates with gleaming silver blade
        for (const sx of [11, 17]) {
          p(sx - 1, 27, OUTLINE, 6, 2);
          p(sx, 27, "#e0f2fe", 4, 1);
          p(sx, 28, "#ffffff", 4, 1);
          // Blade struts + silver runner
          p(sx + 1, 29, "#64748b", 1, 1);
          p(sx + 3, 29, "#64748b", 1, 1);
          p(sx - 1, 29, "#cbd5e1", 6, 1);
          p(sx, 29, "#f8fafc", 4, 1);
        }
        return;
      }

      const shoeStyles: Record<
        Exclude<AvatarConfig["shoes"], "winter_boots" | "brown_loafers" | "ice_skates">,
        { main: string; light: string; sole: string; trim?: string }
      > = {
        sneakers: { main: "#dc2626", light: "#f87171", sole: "#f8fafc" },
        dark_boots: { main: "#27272a", light: "#3f3f46", sole: "#09090b" },
        elf_shoes: { main: "#15803d", light: "#22c55e", sole: "#14532d", trim: "#fbbf24" },
      };
      const st = shoeStyles[avatar.shoes];

      for (const sx of [11, 17]) {
        p(sx - 1, 28, OUTLINE, 6, 2);
        p(sx, 28, st.main, 4, 1);
        p(sx, 28, st.light, 2, 1);
        p(sx, 29, st.sole, 4, 1);
        if (st.trim) {
          p(sx, 27, st.trim, 4, 1);
        }
      }
      if (avatar.shoes === "elf_shoes") {
        p(10, 28, st.light, 1, 1);
        p(21, 28, st.light, 1, 1);
      }
    };
    drawShoes();

    // 4. Bottoms (y = 23..27)
    const drawBottoms = () => {
      const isSkirt = avatar.bottom === "skirt_red" || avatar.bottom === "skirt_dark";
      if (isSkirt) {
        const base = avatar.bottom === "skirt_red" ? "#b91c1c" : "#27272a";
        const light = avatar.bottom === "skirt_red" ? "#ef4444" : "#3f3f46";
        const dark = avatar.bottom === "skirt_red" ? "#7f1d1d" : "#18181b";

        // Legs under skirt
        p(11, 26, OUTLINE, 4, 2);
        p(17, 26, OUTLINE, 4, 2);
        p(12, 26, skin.base, 2, 2);
        p(18, 26, skin.base, 2, 2);
        p(12, 26, skin.dark, 2, 1);
        p(18, 26, skin.dark, 2, 1);

        // Skirt body
        p(10, 23, OUTLINE, 12, 4);
        p(11, 24, base, 10, 2);
        p(12, 24, light, 2, 2);
        p(16, 24, light, 2, 2);
        p(11, 25, dark, 10, 1);
        if (avatar.bottom === "skirt_red") {
          p(13, 24, "#fbbf24", 1, 2);
          p(18, 24, "#fbbf24", 1, 2);
        }
        return;
      }

      const pantStyles: Record<
        Exclude<AvatarConfig["bottom"], "skirt_red" | "skirt_dark">,
        { base: string; light: string; dark: string }
      > = {
        jeans: { base: "#2563eb", light: "#3b82f6", dark: "#1d4ed8" },
        dark_pants: { base: "#27272a", light: "#3f3f46", dark: "#18181b" },
        chinos: { base: "#d6b88d", light: "#ebd3ad", dark: "#b09065" },
        joggers: { base: "#64748b", light: "#94a3b8", dark: "#475569" },
      };
      const pt = pantStyles[avatar.bottom as keyof typeof pantStyles] ?? pantStyles.jeans;

      // Waistband
      p(10, 23, OUTLINE, 12, 2);
      p(11, 24, pt.dark, 10, 1);
      // Legs
      p(10, 25, OUTLINE, 5, 3);
      p(17, 25, OUTLINE, 5, 3);
      p(11, 25, pt.base, 3, 3);
      p(18, 25, pt.base, 3, 3);
      p(11, 25, pt.light, 1, 2);
      p(18, 25, pt.light, 1, 2);
      p(13, 26, pt.dark, 1, 2);
      p(20, 26, pt.dark, 1, 2);
    };
    drawBottoms();

    // 5. Torso & Arms (y = 17..23)
    const drawTop = () => {
      const topColors: Record<
        AvatarConfig["top"],
        { base: string; light: string; dark: string; accent: string }
      > = {
        winter_red: { base: "#b91c1c", light: "#dc2626", dark: "#7f1d1d", accent: "#fef3c7" },
        winter_green: { base: "#15803d", light: "#22c55e", dark: "#14532d", accent: "#fbbf24" },
        hoodie_navy: { base: "#1e3a8a", light: "#2563eb", dark: "#172554", accent: "#e2e8f0" },
        jacket_brown: { base: "#78350f", light: "#9a4a1a", dark: "#451a03", accent: "#fef3c7" },
        scarf_cream: { base: "#fef3c7", light: "#fffbeb", dark: "#e6d5aa", accent: "#b91c1c" },
        suit: { base: "#1f2937", light: "#374151", dark: "#111827", accent: "#f8fafc" },
        turtleneck: { base: "#881337", light: "#be123c", dark: "#4c0519", accent: "#fda4af" },
        cardigan: { base: "#d97706", light: "#f59e0b", dark: "#92400e", accent: "#fffbeb" },
      };
      const tc = topColors[avatar.top];

      // Neck
      p(13, 16, OUTLINE, 6, 2);
      p(14, 17, skin.dark, 4, 1);

      if (isFemale) {
        // Female silhouette: narrower shoulders, tapered waist, flared hem, slim arms
        p(10, 18, OUTLINE, 12, 2);
        p(11, 20, OUTLINE, 10, 2);
        p(9, 22, OUTLINE, 14, 2);
        // Slim arms
        p(9, 19, OUTLINE, 2, 4);
        p(21, 19, OUTLINE, 2, 4);
        p(9, 19, tc.dark, 1, 3);
        p(22, 19, tc.dark, 1, 3);
        // Hands
        p(9, 22, skin.base, 1, 2);
        p(22, 22, skin.base, 1, 2);
        // Torso fill (tapered waist)
        p(11, 18, tc.base, 10, 2);
        p(12, 20, tc.base, 8, 2);
        p(11, 22, tc.base, 10, 2);
        p(11, 18, tc.light, 4, 2);
        p(19, 19, tc.dark, 1, 5);
      } else {
        // Male silhouette: broader shoulders, straight athletic torso, 2px arms
        p(8, 18, OUTLINE, 16, 5);
        p(9, 22, OUTLINE, 14, 2);
        // Arms
        p(8, 19, tc.dark, 2, 3);
        p(22, 19, tc.dark, 2, 3);
        p(8, 19, tc.base, 1, 2);
        p(22, 19, tc.base, 1, 2);
        // Hands
        p(8, 22, skin.base, 2, 2);
        p(22, 22, skin.base, 2, 2);
        // Torso fill
        p(10, 18, tc.base, 12, 6);
        p(10, 18, tc.light, 5, 2);
        p(20, 19, tc.dark, 2, 5);
      }

      // Outfit details
      if (avatar.top === "winter_red") {
        p(12, 20, tc.accent, 8, 1);
        p(12, 21, tc.accent, 1, 1);
        p(15, 21, tc.accent, 2, 1);
        p(19, 21, tc.accent, 1, 1);
        p(14, 18, tc.accent, 4, 1);
      } else if (avatar.top === "winter_green") {
        p(15, 19, tc.accent, 2, 1);
        p(14, 20, tc.accent, 4, 1);
        p(13, 21, "#dc2626", 1, 1);
        p(18, 21, "#dc2626", 1, 1);
      } else if (avatar.top === "hoodie_navy") {
        p(14, 18, tc.accent, 1, 2);
        p(17, 18, tc.accent, 1, 2);
        p(13, 22, tc.dark, 6, 2);
      } else if (avatar.top === "jacket_brown") {
        p(13, 18, tc.accent, 6, 1);
        p(15, 19, "#cbd5e1", 1, 5);
      } else if (avatar.top === "scarf_cream") {
        p(12, 17, tc.accent, 8, 2);
        p(17, 19, tc.accent, 2, 3);
        p(17, 21, "#ef4444", 2, 1);
      } else if (avatar.top === "suit") {
        p(14, 18, tc.accent, 4, 2);
        p(15, 19, tc.accent, 2, 3);
        p(15, 18, "#dc2626", 2, 3);
      } else if (avatar.top === "turtleneck") {
        p(13, 17, tc.light, 6, 2);
      } else if (avatar.top === "cardigan") {
        p(14, 18, tc.accent, 4, 6);
        p(15, 19, "#451a03", 1, 1);
        p(15, 21, "#451a03", 1, 1);
        p(15, 23, "#451a03", 1, 1);
      }
    };
    drawTop();

    // 6. Head & Ears (y = 7..16)
    p(9, 11, OUTLINE, 2, 3);
    p(21, 11, OUTLINE, 2, 3);
    p(9, 12, skin.dark, 1, 1);
    p(22, 12, skin.dark, 1, 1);

    // Head outline (female has softer/narrower chin)
    p(11, 6, OUTLINE, 10, 1);
    p(10, 7, OUTLINE, 12, isFemale ? 8 : 9);
    if (isFemale) {
      p(11, 15, OUTLINE, 10, 1);
      p(12, 16, OUTLINE, 8, 1);
    } else {
      p(11, 16, OUTLINE, 10, 1);
    }

    // Head skin fill
    p(11, 7, skin.base, 10, 8);
    p(isFemale ? 12 : 11, 15, skin.base, isFemale ? 8 : 10, 1);
    p(12, 7, skin.light, 7, 2);
    p(isFemale ? 12 : 11, 15, skin.dark, isFemale ? 8 : 10, 1);

    // Cheeks / blush
    if (skin.blush) {
      p(11, 13, skin.blush, 2, 1, isFemale ? 0.9 : 0.65);
      p(19, 13, skin.blush, 2, 1, isFemale ? 0.9 : 0.65);
    }

    // Eyes (y = 11..12) with selected eyeColor
    p(12, 11, eyeHex, 2, 2);
    p(18, 11, eyeHex, 2, 2);
    // Pupil depth (bottom-right pixel of eye slightly darker)
    p(13, 12, "#111827", 1, 1, 0.45);
    p(19, 12, "#111827", 1, 1, 0.45);
    // Eye sparkle
    p(12, 11, "#ffffff", 1, 1);
    p(18, 11, "#ffffff", 1, 1);

    if (isFemale) {
      // Distinct angled eyelashes
      p(11, 10, "#1c1917", 1, 1);
      p(20, 10, "#1c1917", 1, 1);
      p(11, 11, "#1c1917", 1, 1);
      p(20, 11, "#1c1917", 1, 1);
    } else {
      // Male thicker eyebrows
      p(12, 10, hair.dark, 2, 1);
      p(18, 10, hair.dark, 2, 1);
    }

    // Nose hint & mouth
    p(15, 13, skin.dark, 2, 1, 0.55);
    p(15, 14, isFemale ? "#c85a64" : "#a15447", 2, 1);

    // 7. Facial Hair (Male only)
    if (!isFemale && avatar.facialHair !== "none") {
      if (avatar.facialHair === "stubble") {
        p(11, 14, beard.dark, 1, 1, 0.45);
        p(20, 14, beard.dark, 1, 1, 0.45);
        p(12, 15, beard.dark, 8, 1, 0.45);
        p(13, 16, beard.dark, 6, 1, 0.45);
      } else if (avatar.facialHair === "mustache") {
        p(13, 13, beard.base, 6, 1);
        p(12, 14, beard.dark, 2, 1);
        p(18, 14, beard.dark, 2, 1);
      } else if (avatar.facialHair === "goatee") {
        p(14, 15, beard.base, 4, 2);
        p(15, 16, beard.dark, 2, 1);
      } else if (avatar.facialHair === "full_beard") {
        p(10, 13, OUTLINE, 1, 3);
        p(21, 13, OUTLINE, 1, 3);
        p(11, 13, beard.base, 2, 3);
        p(19, 13, beard.base, 2, 3);
        p(12, 15, beard.base, 8, 2);
        p(13, 16, beard.dark, 6, 1);
        p(14, 13, beard.light, 4, 1);
      } else if (avatar.facialHair === "santa_beard") {
        p(10, 13, OUTLINE, 12, 6);
        p(11, 13, beard.base, 10, 5);
        p(12, 14, beard.light, 8, 3);
        p(13, 17, beard.dark, 6, 2);
        p(15, 14, "#a15447", 2, 1);
      }
    }

    // 8. Front/Top Hair
    const hasHat = avatar.hat !== "none";
    const drawFrontHair = () => {
      if (avatar.hair === "none") return;

      p(10, 8, hair.dark, 1, 4);
      p(21, 8, hair.dark, 1, 4);

      if (!hasHat) {
        p(11, 5, OUTLINE, 10, 2);
        p(11, 6, hair.base, 10, 3);
        p(12, 6, hair.light, 6, 1);
      } else {
        p(11, 8, hair.base, 10, 1);
      }

      if (avatar.hair === "short") {
        p(11, 8, hair.base, 10, 1);
        p(12, 9, hair.dark, 3, 1);
      } else if (avatar.hair === "spiky") {
        if (!hasHat) {
          p(11, 4, OUTLINE, 2, 2);
          p(15, 3, OUTLINE, 2, 3);
          p(19, 4, OUTLINE, 2, 2);
          p(12, 4, hair.light, 1, 2);
          p(15, 4, hair.light, 2, 2);
          p(19, 4, hair.base, 1, 2);
        }
        p(11, 9, hair.base, 2, 1);
        p(14, 9, hair.base, 3, 1);
        p(19, 9, hair.base, 2, 1);
      } else if (avatar.hair === "side_part") {
        p(11, 8, hair.base, 10, 1);
        p(11, 9, hair.base, 5, 1);
        p(12, 10, hair.dark, 2, 1);
      } else if (avatar.hair === "curly") {
        if (!hasHat) {
          p(10, 5, OUTLINE, 12, 3);
          p(10, 6, hair.base, 12, 3);
          p(11, 5, hair.light, 3, 2);
          p(16, 5, hair.light, 3, 2);
        }
        p(9, 8, hair.base, 2, 4);
        p(21, 8, hair.base, 2, 4);
        p(11, 9, hair.dark, 10, 1);
      } else if (avatar.hair === "bob") {
        p(10, 9, hair.base, 2, 6);
        p(20, 9, hair.base, 2, 6);
        p(11, 9, hair.base, 10, 1);
      } else if (avatar.hair === "long" || avatar.hair === "wavy") {
        p(10, 9, hair.base, 2, 6);
        p(20, 9, hair.base, 2, 6);
        p(11, 9, hair.base, 3, 1);
        p(18, 9, hair.base, 3, 1);
      } else if (avatar.hair === "ponytail") {
        p(11, 8, hair.base, 10, 1);
        p(11, 9, hair.dark, 2, 2);
        p(20, 9, hair.dark, 2, 2);
      } else if (avatar.hair === "twin_buns") {
        p(11, 8, hair.base, 10, 1);
        if (!hasHat) {
          p(8, 4, OUTLINE, 4, 4);
          p(9, 5, hair.base, 2, 2);
          p(9, 5, hair.light, 1, 1);
          p(20, 4, OUTLINE, 4, 4);
          p(21, 5, hair.base, 2, 2);
          p(21, 5, hair.light, 1, 1);
        }
      }
    };
    drawFrontHair();

    // 9. Glasses (transparent lenses except sunglasses which are small & solid black)
    if (avatar.glasses !== "none") {
      if (avatar.glasses === "sunglasses") {
        // Compact sleek black sunglasses
        p(11, 11, "#09090b", 4, 2);
        p(17, 11, "#09090b", 4, 2);
        p(15, 11, "#09090b", 2, 1);
        // Subtle glare
        p(12, 11, "#94a3b8", 1, 1, 0.85);
        p(18, 11, "#94a3b8", 1, 1, 0.85);
      } else if (avatar.glasses === "round") {
        // Distinctly rounded (clipped corners) & completely transparent inside
        const c = "#1c1917";
        // Left round rim (x: 11..14, y: 10..13 without corners)
        p(12, 10, c, 2, 1);
        p(12, 13, c, 2, 1);
        p(11, 11, c, 1, 2);
        p(14, 11, c, 1, 2);
        // Right round rim (x: 17..20, y: 10..13 without corners)
        p(18, 10, c, 2, 1);
        p(18, 13, c, 2, 1);
        p(17, 11, c, 1, 2);
        p(20, 11, c, 1, 2);
        // Bridge
        p(15, 11, c, 2, 1);
      } else {
        // Square, gold_rim, festive_red: sharp 90° corners, transparent inside
        const c =
          avatar.glasses === "gold_rim"
            ? "#eab308"
            : avatar.glasses === "festive_red"
              ? "#dc2626"
              : "#1c1917";

        // Left frame (x: 10..14, y: 10..13)
        p(10, 10, c, 5, 1);
        p(11, 13, c, 4, 1);
        p(11, 10, c, 1, 4);
        p(14, 10, c, 1, 4);
        // Right frame (x: 17..21, y: 10..13)
        p(17, 10, c, 5, 1);
        p(17, 13, c, 4, 1);
        p(17, 10, c, 1, 4);
        p(20, 10, c, 1, 4);
        // Bridge
        p(15, 11, c, 2, 1);

        if (avatar.glasses === "festive_red") {
          p(10, 10, "#22c55e", 1, 1);
          p(21, 10, "#22c55e", 1, 1);
        }
      }
    }

    // 10. Hats (y = 1..9)
    const drawHat = () => {
      if (avatar.hat === "none") return;

      if (avatar.hat === "santa") {
        p(11, 4, OUTLINE, 10, 4);
        p(12, 3, OUTLINE, 6, 2);
        p(13, 2, OUTLINE, 4, 2);
        p(12, 4, "#b91c1c", 8, 2);
        p(13, 3, "#dc2626", 4, 2);
        p(10, 6, OUTLINE, 12, 3);
        p(11, 7, "#f8fafc", 10, 2);
        p(11, 7, "#ffffff", 6, 1);
        p(17, 2, OUTLINE, 4, 4);
        p(18, 3, "#ffffff", 2, 2);
      } else if (avatar.hat === "beanie_red" || avatar.hat === "beanie_green") {
        const c =
          avatar.hat === "beanie_red"
            ? { base: "#b91c1c", light: "#ef4444", dark: "#7f1d1d" }
            : { base: "#15803d", light: "#22c55e", dark: "#14532d" };
        p(13, 2, OUTLINE, 6, 2);
        p(14, 3, c.light, 4, 1);
        p(11, 4, OUTLINE, 10, 4);
        p(12, 4, c.base, 8, 3);
        p(13, 4, c.light, 4, 2);
        p(10, 6, OUTLINE, 12, 3);
        p(11, 7, c.dark, 10, 2);
        p(12, 7, c.base, 2, 2);
        p(15, 7, c.base, 2, 2);
        p(18, 7, c.base, 2, 2);
      } else if (avatar.hat === "reindeer") {
        p(10, 6, OUTLINE, 12, 2);
        p(11, 7, "#b91c1c", 10, 1);
        p(8, 2, OUTLINE, 4, 5);
        p(20, 2, OUTLINE, 4, 5);
        p(9, 2, "#9a5b25", 2, 4);
        p(8, 3, "#b46e32", 1, 2);
        p(21, 2, "#9a5b25", 2, 4);
        p(23, 3, "#b46e32", 1, 2);
      } else if (avatar.hat === "crown") {
        p(11, 3, OUTLINE, 10, 5);
        p(12, 4, "#fbbf24", 1, 3);
        p(15, 3, "#fbbf24", 2, 4);
        p(19, 4, "#fbbf24", 1, 3);
        p(12, 6, "#d97706", 8, 1);
        p(15, 5, "#dc2626", 2, 1);
      } else if (avatar.hat === "cap") {
        p(11, 4, OUTLINE, 10, 4);
        p(12, 5, "#1d4ed8", 8, 2);
        p(13, 5, "#3b82f6", 4, 1);
        p(10, 7, OUTLINE, 14, 2);
        p(11, 7, "#1e3a8a", 12, 1);
      } else if (avatar.hat === "ushanka") {
        p(10, 4, OUTLINE, 12, 5);
        p(11, 5, "#78350f", 10, 2);
        p(11, 7, "#e2e8f0", 10, 2);
        p(9, 7, OUTLINE, 2, 6);
        p(21, 7, OUTLINE, 2, 6);
        p(9, 8, "#cbd5e1", 2, 4);
        p(21, 8, "#cbd5e1", 2, 4);
      }
    };
    drawHat();

    return out;
  }, [avatar, crop]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX_BY_CROP[crop]}
      shapeRendering="crispEdges"
      className={`pixelated select-none inline-block ${className}`}
      role="img"
      aria-label={title ?? "Pixel Avatar"}
    >
      {title ? <title>{title}</title> : null}
      {rects.map((r, idx) => (
        <rect
          key={idx}
          x={r.x}
          y={r.y}
          width={r.w ?? 1}
          height={r.h ?? 1}
          fill={r.c}
          fillOpacity={r.o ?? 1}
        />
      ))}
    </svg>
  );
}
