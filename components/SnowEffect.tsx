"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface Flake {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

export default function SnowEffect() {
  const shouldReduceMotion = useReducedMotion();
  const [snowflakes, setSnowflakes] = useState<Flake[]>([]);

  useEffect(() => {
    const flakes: Flake[] = Array.from({ length: 42 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: i % 3 === 0 ? 8 : i % 2 === 0 ? 6 : 4,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 10,
    }));
    setSnowflakes(flakes);
  }, []);

  if (snowflakes.length === 0 || shouldReduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: "110vh", opacity: [0, 0.9, 0.6, 0] }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: "linear",
          }}
          className="absolute bg-sky-300/80 dark:bg-sky-100/75 border border-sky-400/30 dark:border-white/30"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
          }}
        />
      ))}
    </div>
  );
}
