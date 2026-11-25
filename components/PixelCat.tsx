"use client";

import React from "react";

interface PixelCatProps {
  size?: number;
  className?: string;
  title?: string;
}

const O = "#2b1b17"; // Outline
const G = "#e68a3e"; // Ginger fur
const GL = "#f6b26b"; // Ginger highlight
const GD = "#b85d19"; // Ginger shadow
const W = "#fffdf7"; // Cream chest/muzzle
const R = "#b91c1c"; // Santa hat red
const RL = "#ef4444"; // Santa hat highlight
const P = "#f48fb1"; // Pink nose/cheeks

/**
 * Crisp 24x24 pixel-art mascot cat with a festive Santa hat.
 */
export default function PixelCat({
  size = 56,
  className = "",
  title = "Pixel Kedi",
}: PixelCatProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className={`pixelated select-none inline-block ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {/* Ground shadow */}
      <rect x="6" y="22" width="12" height="1" fill="#000000" fillOpacity="0.22" />

      {/* Curled Tail */}
      <rect x="17" y="15" width="4" height="5" fill={O} />
      <rect x="19" y="13" width="3" height="4" fill={O} />
      <rect x="18" y="16" width="2" height="3" fill={GD} />
      <rect x="20" y="14" width="1" height="2" fill={G} />
      <rect x="20" y="13" width="1" height="1" fill={W} />

      {/* Body */}
      <rect x="6" y="14" width="12" height="7" fill={O} />
      <rect x="7" y="15" width="10" height="5" fill={G} />
      <rect x="7" y="15" width="3" height="4" fill={GL} />
      <rect x="15" y="15" width="2" height="5" fill={GD} />
      {/* Cream belly */}
      <rect x="9" y="15" width="6" height="5" fill={W} />

      {/* Paws */}
      <rect x="6" y="20" width="4" height="2" fill={O} />
      <rect x="14" y="20" width="4" height="2" fill={O} />
      <rect x="7" y="20" width="2" height="1" fill={W} />
      <rect x="15" y="20" width="2" height="1" fill={W} />

      {/* Cat Ears */}
      <rect x="5" y="5" width="4" height="4" fill={O} />
      <rect x="15" y="5" width="4" height="4" fill={O} />
      <rect x="6" y="6" width="2" height="2" fill={G} />
      <rect x="16" y="6" width="2" height="2" fill={G} />
      <rect x="7" y="7" width="1" height="1" fill={P} />
      <rect x="16" y="7" width="1" height="1" fill={P} />

      {/* Head */}
      <rect x="5" y="7" width="14" height="8" fill={O} />
      <rect x="6" y="8" width="12" height="6" fill={G} />
      <rect x="7" y="8" width="10" height="2" fill={GL} />
      {/* Cream muzzle */}
      <rect x="9" y="11" width="6" height="3" fill={W} />

      {/* Cute big eyes */}
      <rect x="7" y="10" width="2" height="2" fill={O} />
      <rect x="15" y="10" width="2" height="2" fill={O} />
      <rect x="7" y="10" width="1" height="1" fill="#ffffff" />
      <rect x="15" y="10" width="1" height="1" fill="#ffffff" />

      {/* Blush & pink nose */}
      <rect x="6" y="12" width="2" height="1" fill={P} fillOpacity="0.85" />
      <rect x="16" y="12" width="2" height="1" fill={P} fillOpacity="0.85" />
      <rect x="11" y="12" width="2" height="1" fill={P} />

      {/* Tiny Santa Hat */}
      <rect x="9" y="2" width="6" height="4" fill={O} />
      <rect x="10" y="3" width="4" height="2" fill={R} />
      <rect x="11" y="3" width="2" height="1" fill={RL} />
      <rect x="8" y="5" width="8" height="2" fill={O} />
      <rect x="9" y="6" width="6" height="1" fill={W} />
      {/* Hat pom-pom */}
      <rect x="14" y="2" width="3" height="3" fill={O} />
      <rect x="15" y="3" width="1" height="1" fill={W} />
    </svg>
  );
}
