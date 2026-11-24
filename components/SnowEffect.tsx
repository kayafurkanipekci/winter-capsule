"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; duration: number; delay: number }[]>([]);

  // Wait for client mount before generating snowflakes
  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 10,
    }));
    setSnowflakes(flakes);
  }, []);

  // Render nothing during SSR
  if (snowflakes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          initial={{
            y: -20, // Start just above the viewport
            opacity: 0,
          }}
          animate={{
            y: "110vh", // Fall past the bottom of the viewport
            opacity: [0, 1, 0.5, 0], // Fade in, shimmer, fade out
          }}
          transition={{
            duration: flake.duration, // 10-20 seconds for a calm pace
            repeat: Infinity,
            delay: flake.delay, // Randomize start offset
            ease: "linear",
          }}
          className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full blur-[1px] shadow-[0_0_6px_rgba(100,150,255,0.9)]"
          style={{
            left: flake.left, // Random horizontal position
          }}
        />
      ))}
    </div>
  );
}