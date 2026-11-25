"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const O = "#2b1b17"; // Outline
const G = "#15803d"; // Elf green
const GL = "#22c55e"; // Elf green light
const R = "#b91c1c"; // Elf red accent
const S = "#f5cfa8"; // Skin
const B = "#78350f"; // Boots/belt

function PixelSpyElf({
  flip = false,
  size = 48,
}: {
  flip?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 22"
      shapeRendering="crispEdges"
      className="pixelated select-none block"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      {/* Pointy Spy Elf Hat */}
      <rect x="6" y="1" width="5" height="2" fill={O} />
      <rect x="7" y="2" width="3" height="1" fill={G} />
      <rect x="5" y="3" width="9" height="3" fill={O} />
      <rect x="6" y="3" width="7" height="2" fill={G} />
      <rect x="7" y="3" width="4" height="1" fill={GL} />
      <rect x="5" y="5" width="9" height="1" fill={R} />

      {/* Pointy Ears */}
      <rect x="3" y="7" width="2" height="2" fill={O} />
      <rect x="4" y="7" width="1" height="1" fill={S} />
      <rect x="14" y="7" width="2" height="2" fill={O} />
      <rect x="14" y="7" width="1" height="1" fill={S} />

      {/* Head */}
      <rect x="5" y="6" width="9" height="6" fill={O} />
      <rect x="6" y="7" width="7" height="4" fill={S} />

      {/* Spy Sunglasses */}
      <rect x="6" y="8" width="7" height="2" fill="#09090b" />
      <rect x="7" y="8" width="2" height="1" fill="#60a5fa" fillOpacity="0.8" />
      <rect x="11" y="8" width="1" height="1" fill="#60a5fa" fillOpacity="0.8" />

      {/* Sneaky Scarf & Coat */}
      <rect x="5" y="12" width="9" height="6" fill={O} />
      <rect x="6" y="12" width="7" height="1" fill={R} />
      <rect x="6" y="13" width="7" height="4" fill={G} />
      <rect x="6" y="15" width="7" height="1" fill={B} />
      <rect x="9" y="15" width="2" height="1" fill="#fbbf24" />

      {/* Arms gripping rope */}
      <rect x="4" y="13" width="2" height="3" fill={O} />
      <rect x="4" y="13" width="1" height="2" fill={S} />
      <rect x="13" y="13" width="2" height="3" fill={O} />
      <rect x="14" y="13" width="1" height="2" fill={S} />

      {/* Boots */}
      <rect x="6" y="18" width="3" height="3" fill={O} />
      <rect x="10" y="18" width="3" height="3" fill={O} />
      <rect x="6" y="19" width="2" height="1" fill={B} />
      <rect x="11" y="19" width="2" height="1" fill={B} />
    </svg>
  );
}

function PixelSnowball({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className="pixelated select-none block"
      aria-hidden="true"
    >
      <rect x="2" y="1" width="4" height="6" fill={O} />
      <rect x="1" y="2" width="6" height="4" fill={O} />
      <rect x="2" y="2" width="4" height="4" fill="#e0f2fe" />
      <rect x="2" y="2" width="3" height="3" fill="#ffffff" />
    </svg>
  );
}

type DefensePhase =
  | "idle"
  | "left_descend"
  | "left_throw"
  | "left_hit"
  | "right_descend"
  | "right_throw"
  | "right_hit";

interface MailboxDefenseSceneProps {
  children: (state: {
    snowmanFacingLeft: boolean;
    snowmanThrowing: boolean;
  }) => React.ReactNode;
}

/**
 * Coordinates angled rappelling spy elves from the ceiling and triggers
 * the existing Mailbox snowman to defend by throwing snowballs.
 */
export default function MailboxDefenseScene({ children }: MailboxDefenseSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<DefensePhase>("idle");

  useEffect(() => {
    if (shouldReduceMotion) return;

    const sequence: { phase: DefensePhase; duration: number }[] = [
      { phase: "idle", duration: 1200 },
      { phase: "left_descend", duration: 1450 },
      { phase: "left_throw", duration: 400 },
      { phase: "left_hit", duration: 1150 },
      { phase: "idle", duration: 4500 },
      { phase: "right_descend", duration: 1450 },
      { phase: "right_throw", duration: 400 },
      { phase: "right_hit", duration: 1150 },
      { phase: "idle", duration: 6500 },
    ];

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      setPhase(sequence[idx].phase);
      const wait = sequence[idx].duration;
      idx = (idx + 1) % sequence.length;
      timer = setTimeout(step, wait);
    };

    step();
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  const leftActive = phase === "left_descend" || phase === "left_throw";
  const leftHit = phase === "left_hit";
  const rightActive = phase === "right_descend" || phase === "right_throw";
  const rightHit = phase === "right_hit";

  const snowmanFacingLeft =
    phase === "left_descend" || phase === "left_throw" || phase === "left_hit";
  const snowmanThrowing = phase === "left_throw" || phase === "right_throw";

  return (
    <div className="relative w-full max-w-2xl mx-auto pt-4 pb-2 px-2 flex flex-col items-center">
      {/* LEFT SPY ELF + CEILING ROPE */}
      <div className="pointer-events-none absolute top-0 left-1 sm:left-6 z-20">
        {(leftActive || leftHit) && (
          <motion.div
            initial={{ x: 0, y: -140, rotate: -12, opacity: 1 }}
            animate={
              leftHit
                ? { x: 18, y: 150, rotate: -75, opacity: 0 }
                : { x: 26, y: 28, rotate: -14, opacity: 1 }
            }
            transition={{
              duration: leftHit ? 0.85 : 1.3,
              ease: leftHit ? "easeIn" : "easeOut",
            }}
            className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center"
          >
            {/* Rope attached directly to elf's hands, extending up to ceiling */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{
                opacity: leftHit ? 0 : 1,
                y: leftHit ? -120 : 0,
              }}
              transition={{ duration: leftHit ? 0.25 : 0.3 }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, #9a4a1a 0px, #9a4a1a 4px, #5c2808 4px, #5c2808 8px)",
              }}
              className="absolute bottom-[70%] left-1/2 -translate-x-1/2 w-[3px] h-[640px] bg-[#78350f] border-x border-[#2b1b17]"
            />

            <PixelSpyElf size={48} />

            {leftHit && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-2.5 h-2.5 bg-white border border-[#2b1b17] absolute top-0 left-1" />
                <span className="w-3 h-3 bg-[#e0f2fe] border border-[#2b1b17] absolute bottom-1 right-0" />
                <span className="w-2 h-2 bg-white border border-[#2b1b17] absolute top-2 right-1" />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* RIGHT SPY ELF + CEILING ROPE */}
      <div className="pointer-events-none absolute top-0 right-1 sm:right-6 z-20">
        {(rightActive || rightHit) && (
          <motion.div
            initial={{ x: 0, y: -140, rotate: 12, opacity: 1 }}
            animate={
              rightHit
                ? { x: -18, y: 150, rotate: 75, opacity: 0 }
                : { x: -26, y: 28, rotate: 14, opacity: 1 }
            }
            transition={{
              duration: rightHit ? 0.85 : 1.3,
              ease: rightHit ? "easeIn" : "easeOut",
            }}
            className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center"
          >
            {/* Rope attached directly to elf's hands, extending up to ceiling */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{
                opacity: rightHit ? 0 : 1,
                y: rightHit ? -120 : 0,
              }}
              transition={{ duration: rightHit ? 0.25 : 0.3 }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, #9a4a1a 0px, #9a4a1a 4px, #5c2808 4px, #5c2808 8px)",
              }}
              className="absolute bottom-[70%] left-1/2 -translate-x-1/2 w-[3px] h-[640px] bg-[#78350f] border-x border-[#2b1b17]"
            />

            <PixelSpyElf flip size={48} />

            {rightHit && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-2.5 h-2.5 bg-white border border-[#2b1b17] absolute top-0 right-1" />
                <span className="w-3 h-3 bg-[#e0f2fe] border border-[#2b1b17] absolute bottom-1 left-0" />
                <span className="w-2 h-2 bg-white border border-[#2b1b17] absolute top-2 left-1" />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* FLYING SNOWBALLS FROM EXISTING MAILBOX SNOWMAN */}
      {phase === "left_throw" && (
        <motion.div
          key="ball-left"
          initial={{ left: "66%", top: "66%", scale: 0.9 }}
          animate={{ left: "10%", top: "22%", scale: 1.15 }}
          transition={{ duration: 0.36, ease: "linear" }}
          className="pointer-events-none absolute z-30"
        >
          <PixelSnowball size={16} />
        </motion.div>
      )}
      {phase === "right_throw" && (
        <motion.div
          key="ball-right"
          initial={{ left: "68%", top: "66%", scale: 0.9 }}
          animate={{ left: "88%", top: "22%", scale: 1.15 }}
          transition={{ duration: 0.36, ease: "linear" }}
          className="pointer-events-none absolute z-30"
        >
          <PixelSnowball size={16} />
        </motion.div>
      )}

      {/* CENTRAL MAILBOX (WITH ITS EXISTING SNOWMAN) */}
      <div className="relative z-10 flex items-end justify-center">
        {children({ snowmanFacingLeft, snowmanThrowing })}
      </div>
    </div>
  );
}
