"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, SkipForward, X } from "lucide-react";
import PixelSprite from "./PixelSprite";
import { useI18n } from "@/lib/i18n/context";

interface PixelRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PixelRulesModal({ isOpen, onClose }: PixelRulesModalProps) {
  const { t } = useI18n();

  const scoreTiles = [
    {
      label: t.game.rulesModal.scoreNoHint.split(":")[0],
      pts: "+3",
      bg: "bg-[#1b4332] text-[#f4e4bc]",
      sprite: <PixelSprite name="envelope_sealed" width={22} height={15} />,
    },
    {
      label: t.game.rulesModal.scoreOneHint.split(":")[0],
      pts: "+2",
      bg: "bg-[#2d6a4f] text-[#fffdf7]",
      sprite: <PixelSprite name="bell" width={18} height={18} />,
    },
    {
      label: t.game.rulesModal.scoreTwoHints.split(":")[0],
      pts: "+1",
      bg: "bg-[#d97706] text-[#fffdf7]",
      sprite: (
        <div className="flex items-center gap-0.5">
          <PixelSprite name="bell" width={14} height={14} />
          <PixelSprite name="bell" width={14} height={14} />
        </div>
      ),
    },
    {
      label: t.game.passButton,
      pts: "-1",
      bg: "bg-zinc-600 text-white",
      sprite: <SkipForward size={16} />,
    },
    {
      label: t.game.results.wrong,
      pts: "-3",
      bg: "bg-[#b91c1c] text-white",
      sprite: <X size={16} />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="pixel-panel max-w-lg w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* Header with Santa Cat & Holly */}
            <div className="flex items-center justify-center gap-3 border-b-2 border-[#8b7355]/40 pb-3">
              <PixelSprite name="holly" width={24} height={18} />
              <PixelSprite name="santa_cat" width={36} height={36} />
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#2b1b17]">
                {t.game.rulesModal.title}
              </h2>
              <PixelSprite name="holly" width={24} height={18} />
            </div>

            {/* Visual 3-Panel Pixel Mini-Story */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Read Clues */}
              <div className="pixel-inset p-3 flex flex-col items-center text-center gap-2">
                <div className="h-12 flex items-center justify-center gap-1">
                  <PixelSprite name="envelope_sealed" width={32} height={22} />
                </div>
                <span className="bg-[#3e2723] text-[#f4e4bc] px-2 py-0.5 text-[10px] font-cinzel font-bold">
                  #1
                </span>
                <p className="font-merriweather text-[11px] text-[#2b1b17] leading-snug">
                  {t.game.rulesModal.rule1}
                </p>
              </div>

              {/* Step 2: 1 Name = 1 Card */}
              <div className="pixel-inset p-3 flex flex-col items-center text-center gap-2">
                <div className="h-12 flex items-center justify-center gap-1.5">
                  <PixelSprite name="reindeer" width={40} height={30} />
                  <span className="font-cinzel font-bold text-sm text-[#b91c1c]">1×</span>
                </div>
                <span className="bg-[#3e2723] text-[#f4e4bc] px-2 py-0.5 text-[10px] font-cinzel font-bold">
                  #2
                </span>
                <p className="font-merriweather text-[11px] text-[#2b1b17] leading-snug">
                  {t.game.rulesModal.rule2}
                </p>
              </div>

              {/* Step 3: No Undo, Final Reveal */}
              <div className="pixel-inset p-3 flex flex-col items-center text-center gap-2">
                <div className="h-12 flex items-center justify-center gap-1.5">
                  <Lock size={18} className="text-[#b91c1c]" />
                  <PixelSprite name="trophy_crown" width={28} height={28} />
                </div>
                <span className="bg-[#3e2723] text-[#f4e4bc] px-2 py-0.5 text-[10px] font-cinzel font-bold">
                  #3
                </span>
                <p className="font-merriweather text-[11px] text-[#2b1b17] leading-snug">
                  {t.game.rulesModal.rule3}
                </p>
              </div>
            </div>

            {/* Visual Scoreboard Tiles */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <PixelSprite name="gift_box" width={20} height={20} />
                <p className="font-cinzel font-bold text-sm text-[#2b1b17]">
                  {t.game.rulesModal.scoringTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {scoreTiles.map((tile, idx) => (
                  <div
                    key={idx}
                    className={`${tile.bg} border-2 border-[#2b1b17] shadow-[2px_2px_0_#2b1b17] p-2.5 flex flex-col items-center justify-between text-center gap-1.5`}
                  >
                    <div className="h-6 flex items-center justify-center">{tile.sprite}</div>
                    <span className="font-cinzel font-bold text-lg leading-none">{tile.pts}</span>
                    <span className="font-merriweather text-[10px] leading-tight opacity-95">
                      {tile.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 pixel-btn pixel-btn-red font-cinzel font-bold text-base flex items-center justify-center gap-2"
            >
              <PixelSprite name="gift_box" width={20} height={20} />
              <span>{t.game.rulesModal.startButton}</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
