"use client";

import React from "react";

export type PixelSpriteName =
  | "holly"
  | "bell"
  | "gift_box"
  | "trophy_crown"
  | "envelope_sealed"
  | "santa_cat"
  | "snowman"
  | "pine_tree"
  | "mailbox_closed"
  | "mailbox_locked"
  | "mailbox_open"
  | "reindeer";

interface PixelSpriteProps {
  name: PixelSpriteName;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function PixelSprite({
  name,
  alt = "",
  className = "",
  width,
  height,
}: PixelSpriteProps) {
  return (
    <img
      src={`/pixel/${name}.png`}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      className={`pixelated select-none inline-block ${className}`}
    />
  );
}
