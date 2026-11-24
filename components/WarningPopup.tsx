"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface WarningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function WarningPopup({ isOpen, onClose, title, message }: WarningPopupProps) {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 z-[60] backdrop-blur-sm"
          />

          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              className="w-full max-w-sm pixel-panel overflow-hidden pointer-events-auto"
            >
              <div className="bg-[#b91c1c] p-3.5 border-b-4 border-[#2b1b17] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#fffdf7]">
                  <AlertTriangle size={20} />
                  <h3 className="font-cinzel font-bold text-base">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#fffdf7]/90 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 text-center space-y-5">
                <p className="font-merriweather text-[#2b1b17] text-sm">
                  {message}
                </p>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 pixel-btn pixel-btn-wood font-cinzel font-bold text-sm"
                >
                  {t.warningPopup.confirmButton}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
