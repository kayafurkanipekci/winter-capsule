"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import AvatarCreator from "@/components/avatar/AvatarCreator";
import { AvatarConfig } from "@/lib/avatar";
import { useI18n } from "@/lib/i18n/context";

interface AvatarCreatorModalProps {
  open: boolean;
  initialConfig: AvatarConfig;
  onClose: () => void;
  onConfirm: (config: AvatarConfig, encodedId: string) => void;
}

export default function AvatarCreatorModal({
  open,
  initialConfig,
  onClose,
  onConfirm,
}: AvatarCreatorModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<AvatarConfig>(initialConfig);

  useEffect(() => {
    if (open) {
      setDraft(initialConfig);
    }
    document.body.classList.toggle("avatar-modal-open", open);
    return () => {
      document.body.classList.remove("avatar-modal-open");
    };
  }, [open, initialConfig]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl my-2 sm:my-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-panel p-3 sm:p-4 mb-2 flex items-center justify-between gap-3">
          <h2 className="font-pixel text-sm sm:text-base text-[#2b1b17]">
            {t.avatar.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pixel-btn bg-[#e6d5aa] text-[#2b1b17] p-1.5"
          >
            <X size={16} />
          </button>
        </div>

        <AvatarCreator
          value={draft}
          onChange={setDraft}
          onSave={(cfg, id) => onConfirm(cfg, id)}
          saveLabel={t.avatar.confirmButton}
        />
      </div>
    </div>
  );
}
