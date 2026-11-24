"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import PixelSprite from "./PixelSprite";

export default function ReindeerWalker() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [facingRight, setFacingRight] = useState(true);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setFacingRight((prev) => !prev);
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || shouldReduceMotion) return null;

  return (
    <div className="fixed bottom-1 left-0 right-0 pointer-events-none z-20 overflow-hidden h-16">
      <motion.div
        animate={{
          x: facingRight ? ["-90px", "calc(100vw + 90px)"] : ["calc(100vw + 90px)", "-90px"],
          y: [0, -4, 0, -4, 0],
        }}
        transition={{
          x: { duration: 14, ease: "linear" },
          y: { duration: 0.85, repeat: Infinity, ease: "easeInOut" },
        }}
        className="inline-block"
      >
        <div
          style={{
            transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
          }}
        >
          <PixelSprite
            name="reindeer"
            width={72}
            height={54}
            className="drop-shadow-[2px_2px_0_rgba(43,27,23,0.4)]"
          />
        </div>
      </motion.div>
    </div>
  );
}
