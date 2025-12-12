"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface WarningPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export default function WarningPopup({ isOpen, onClose, title, message }: WarningPopupProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    />

                    {/* Container for centering */}
                    <motion.div
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Popup Card */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#f4e4bc] rounded-lg shadow-[0_0_50px_rgba(139,0,0,0.3)] border-2 border-[#8b0000] overflow-hidden pointer-events-auto"
                        >

                            {/* Header */}
                            <div className="bg-[#8b0000] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#f4e4bc]">
                                    <AlertTriangle size={24} />
                                    <h3 className="font-cinzel font-bold text-lg">{title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-[#f4e4bc]/80 hover:text-[#f4e4bc] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 text-center">
                                <p className="font-merriweather text-[#3e2723] mb-6">
                                    {message}
                                </p>

                                <button
                                    onClick={onClose}
                                    className="w-full py-2 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#5d4037] transition-colors"
                                >
                                    ANLAŞILDI
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
