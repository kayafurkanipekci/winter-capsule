"use client";

import { motion } from "framer-motion";
import PixelSprite from "./PixelSprite";

interface MailboxProps {
  username: string;
  messageCount: number;
  isLocked: boolean;
  onClick: () => void;
  isOpen: boolean;
  snowmanFacingLeft?: boolean;
  snowmanThrowing?: boolean;
}

export default function Mailbox({
  username,
  messageCount,
  isLocked,
  onClick,
  isOpen,
  snowmanFacingLeft = false,
  snowmanThrowing = false,
}: MailboxProps) {
  const spriteName = isLocked ? "mailbox_locked" : isOpen ? "mailbox_open" : "mailbox_closed";

  return (
    <div
      className="relative flex flex-col items-center justify-end cursor-pointer group select-none pt-2"
      onClick={onClick}
    >
      {/* Pixel Nameplate */}
      <div className="mb-3 bg-[#e6d5aa] px-4 py-1.5 border-3 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] flex items-center gap-2 group-hover:-translate-y-0.5 transition-transform">
        <PixelSprite name="holly" width={24} height={18} />
        <span className="font-cinzel text-[#2b1b17] font-bold text-sm tracking-wider">
          {username}
        </span>
      </div>

      {/* Festive Pixel Scene: Pine Tree + Mailbox + Snowman */}
      <div className="relative flex items-end justify-center gap-2 px-4">
        <PixelSprite
          name="pine_tree"
          width={72}
          height={96}
          className="hidden sm:block shrink-0 drop-shadow-[2px_2px_0_rgba(43,27,23,0.4)]"
        />

        <motion.div
          animate={
            isLocked
              ? { rotate: [0, -2, 2, 0] }
              : { y: [0, -3, 0] }
          }
          transition={{
            duration: isLocked ? 3 : 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <PixelSprite
            name={spriteName}
            width={112}
            height={144}
            className="drop-shadow-[4px_4px_0_rgba(43,27,23,0.45)]"
          />

          {/* Pixel Count Badge */}
          <div className="absolute -top-2 -right-2 bg-[#b91c1c] text-[#fffdf7] min-w-[34px] h-[34px] px-1.5 flex items-center justify-center border-3 border-[#2b1b17] shadow-[2px_2px_0_#2b1b17]">
            <span className="font-cinzel font-bold text-base">{messageCount}</span>
          </div>
        </motion.div>

        <motion.div
          animate={{
            scaleX: snowmanFacingLeft ? -1 : 1,
            y: snowmanThrowing ? -6 : 0,
          }}
          transition={{ duration: 0.18 }}
          className="shrink-0"
        >
          <PixelSprite
            name="snowman"
            width={60}
            height={72}
            className="drop-shadow-[2px_2px_0_rgba(43,27,23,0.4)]"
          />
        </motion.div>
      </div>

      {/* Snowy Pixel Ground Strip */}
      <div className="w-64 sm:w-80 h-3 bg-[#fffdf7] dark:bg-[#cfe8ff] border-2 border-[#2b1b17] shadow-[3px_3px_0_#2b1b17] -mt-1" />
    </div>
  );
}
