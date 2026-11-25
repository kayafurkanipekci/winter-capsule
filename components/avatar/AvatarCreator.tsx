"use client";

import React, { useState } from "react";
import {
  Ban,
  Check,
  Crown,
  Glasses,
  Moon,
  RefreshCw,
  Scissors,
  Shirt,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import PixelAvatar from "@/components/avatar/PixelAvatar";
import { useI18n } from "@/lib/i18n/context";
import {
  AVATAR_BODIES,
  AVATAR_BOTTOMS,
  AVATAR_EYE_COLORS,
  AVATAR_FACIAL_HAIRS,
  AVATAR_GLASSES,
  AVATAR_HAIR_COLORS,
  AVATAR_HAIRS,
  AVATAR_HATS,
  AVATAR_SHOES,
  AVATAR_TOPS,
  AvatarConfig,
  SKIN_MAX,
  SKIN_MIN,
  encodeAvatarId,
  generateRandomAvatar,
} from "@/lib/avatar";

type TabId = "body" | "hair" | "beard" | "glasses" | "hat" | "outfit";

interface AvatarCreatorProps {
  value: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
  onSave?: (config: AvatarConfig, encodedId: string) => void;
  saveLabel?: string;
}

export default function AvatarCreator({
  value,
  onChange,
  onSave,
  saveLabel,
}: AvatarCreatorProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("body");
  const [previewBackdrop, setPreviewBackdrop] = useState<"night" | "parchment">("night");

  const encodedId = encodeAvatarId(value);
  const effectiveSaveLabel = saveLabel ?? t.avatar.confirmButton;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "body", label: t.avatar.tabs.body, icon: <User size={16} /> },
    { id: "hair", label: t.avatar.tabs.hair, icon: <Scissors size={16} /> },
    ...(value.body === "male"
      ? [{ id: "beard" as TabId, label: t.avatar.tabs.beard, icon: <Sparkles size={16} /> }]
      : []),
    { id: "glasses", label: t.avatar.tabs.glasses, icon: <Glasses size={16} /> },
    { id: "hat", label: t.avatar.tabs.hat, icon: <Crown size={16} /> },
    { id: "outfit", label: t.avatar.tabs.outfit, icon: <Shirt size={16} /> },
  ];

  const currentTab: TabId =
    activeTab === "beard" && value.body === "female" ? "hair" : activeTab;

  const updateField = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) => {
    const next: AvatarConfig = { ...value, [key]: val };
    if (key === "body" && val === "female") {
      next.facialHair = "none";
    }
    onChange(next);
  };

  const handleRandomize = () => {
    onChange(generateRandomAvatar());
  };

  return (
    <div className="pixel-panel p-3 sm:p-5 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
      {/* CHARACTER STAGE: Sticky at top on mobile, left column on desktop */}
      <div className="lg:col-span-5 sticky top-1 z-20 lg:static flex flex-col gap-3">
        <div
          className={`relative border-4 border-[#2b1b17] flex items-center justify-center h-[170px] sm:h-[210px] lg:h-[340px] overflow-hidden transition-colors shadow-[4px_4px_0_#2b1b17] ${
            previewBackdrop === "night"
              ? "bg-[#0f2419] text-[#f4e4bc]"
              : "bg-[#faf3e0] text-[#2b1b17]"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <span className="absolute top-4 left-6 w-1.5 h-1.5 bg-current" />
            <span className="absolute top-10 right-8 w-2 h-2 bg-[#fbbf24]" />
            <span className="absolute bottom-6 left-10 w-1.5 h-1.5 bg-current" />
            <span className="absolute bottom-10 right-12 w-1.5 h-1.5 bg-current" />
          </div>

          <button
            type="button"
            onClick={() =>
              setPreviewBackdrop((prev) => (prev === "night" ? "parchment" : "night"))
            }
            className="absolute top-2.5 left-2.5 z-20 pixel-btn bg-[#f4e4bc] text-[#2b1b17] p-1.5 sm:p-2"
          >
            {previewBackdrop === "night" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            onClick={handleRandomize}
            className="absolute top-2.5 right-2.5 z-20 pixel-btn pixel-btn-green px-2.5 py-1.5 font-pixel text-[11px] flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{t.avatar.randomizeButton}</span>
          </button>

          <div className="relative z-10 drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] lg:hidden">
            <PixelAvatar config={value} size={136} />
          </div>
          <div className="relative z-10 drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] hidden lg:block">
            <PixelAvatar config={value} size={224} />
          </div>
        </div>

        {onSave && (
          <button
            type="button"
            onClick={() => onSave(value, encodedId)}
            className="hidden lg:flex pixel-btn pixel-btn-red w-full py-3 px-4 font-pixel text-sm items-center justify-center gap-2"
          >
            <Check size={16} />
            {effectiveSaveLabel}
          </button>
        )}
      </div>

      {/* CUSTOMIZATION PANEL */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`pixel-btn py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-pixel text-[10px] sm:text-[11px] ${
                  active
                    ? "bg-[#b91c1c] text-[#fffdf7]"
                    : "bg-[#e6d5aa] text-[#2b1b17] hover:bg-[#faf3e0]"
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pixel-inset p-3 sm:p-4 flex flex-col gap-4 lg:min-h-[340px] lg:max-h-[400px] lg:overflow-y-auto">
          {currentTab === "body" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {AVATAR_BODIES.map((b) => {
                  const selected = value.body === b.id;
                  const bodyLabel = b.id === "male" ? t.avatar.male : t.avatar.female;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateField("body", b.id)}
                      className={`p-2.5 border-2 flex items-center justify-center gap-2.5 transition-colors ${
                        selected
                          ? "border-[#b91c1c] bg-[#b91c1c] text-[#fffdf7] shadow-[3px_3px_0_#2b1b17]"
                          : "border-[#2b1b17] bg-[#faf3e0] text-[#2b1b17] hover:bg-[#f4e4bc]"
                      }`}
                    >
                      <PixelAvatar
                        config={{
                          ...value,
                          body: b.id,
                          facialHair: b.id === "female" ? "none" : value.facialHair,
                        }}
                        size={40}
                      />
                      <span className="font-pixel text-xs">{bodyLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-pixel text-[11px] uppercase tracking-wider text-[#5d4037]">
                  {t.avatar.skinTone}
                </span>
                <div className="p-2 bg-[#faf3e0] border-2 border-[#2b1b17]">
                  <input
                    type="range"
                    min={SKIN_MIN}
                    max={SKIN_MAX}
                    step={1}
                    value={value.skin}
                    onChange={(e) => updateField("skin", Number(e.target.value))}
                    aria-label={t.avatar.skinTone}
                    className="w-full h-4 appearance-none cursor-pointer border-2 border-[#2b1b17]"
                    style={{
                      background:
                        "linear-gradient(90deg, #fde2d2 0%, #f5cfa8 22%, #e2b184 44%, #c68b59 65%, #8d5524 84%, #5c3822 100%)",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-pixel text-[11px] uppercase tracking-wider text-[#5d4037]">
                  {t.avatar.eyeColor}
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EYE_COLORS.map((ec) => {
                    const selected = value.eyeColor === ec.id;
                    return (
                      <button
                        key={ec.id}
                        type="button"
                        onClick={() => updateField("eyeColor", ec.id)}
                        title={ec.label}
                        className={`w-9 h-9 border-2 flex items-center justify-center transition-transform ${
                          selected
                            ? "border-[#b91c1c] scale-110 shadow-[2px_2px_0_#2b1b17]"
                            : "border-[#2b1b17] hover:scale-105"
                        }`}
                        style={{ backgroundColor: ec.color }}
                      >
                        {selected && <Check size={15} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {currentTab === "hair" && (
            <>
              <div className="flex flex-wrap gap-2">
                {AVATAR_HAIR_COLORS.map((hc) => {
                  const selected = value.hairColor === hc.id;
                  return (
                    <button
                      key={hc.id}
                      type="button"
                      onClick={() => updateField("hairColor", hc.id)}
                      title={hc.label}
                      className={`w-8 h-8 border-2 flex items-center justify-center transition-transform ${
                        selected
                          ? "border-[#b91c1c] scale-110 shadow-[2px_2px_0_#2b1b17]"
                          : "border-[#2b1b17] hover:scale-105"
                      }`}
                      style={{ backgroundColor: hc.base }}
                    >
                      {selected && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {AVATAR_HAIRS.map((hair) => (
                  <VisualTile
                    key={hair.id}
                    selected={value.hair === hair.id}
                    onClick={() => updateField("hair", hair.id)}
                    title={hair.label}
                    isNone={hair.id === "none"}
                  >
                    <PixelAvatar
                      config={{ ...value, hair: hair.id, hat: "none" }}
                      size={44}
                      crop="head"
                    />
                  </VisualTile>
                ))}
              </div>
            </>
          )}

          {currentTab === "beard" && (
            value.body === "male" ? (
              <>
                {/* Beard Color Swatches */}
                <div className="flex flex-wrap gap-2">
                  {AVATAR_HAIR_COLORS.map((hc) => {
                    const selected = (value.facialHairColor ?? value.hairColor) === hc.id;
                    return (
                      <button
                        key={hc.id}
                        type="button"
                        onClick={() => updateField("facialHairColor", hc.id)}
                        title={hc.label}
                        className={`w-8 h-8 border-2 flex items-center justify-center transition-transform ${
                          selected
                            ? "border-[#b91c1c] scale-110 shadow-[2px_2px_0_#2b1b17]"
                            : "border-[#2b1b17] hover:scale-105"
                        }`}
                        style={{ backgroundColor: hc.base }}
                      >
                        {selected && <Check size={14} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {AVATAR_FACIAL_HAIRS.map((fh) => (
                    <VisualTile
                      key={fh.id}
                      selected={value.facialHair === fh.id}
                      onClick={() => updateField("facialHair", fh.id)}
                      title={fh.label}
                      isNone={fh.id === "none"}
                    >
                      <PixelAvatar
                        config={{ ...value, facialHair: fh.id, hat: "none", glasses: "none" }}
                        size={48}
                        crop="head"
                      />
                    </VisualTile>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="font-pixel text-xs text-[#5d4037]">
                  {t.avatar.male}
                </p>
                <button
                  type="button"
                  onClick={() => updateField("body", "male")}
                  className="pixel-btn pixel-btn-red px-4 py-2 font-pixel text-xs"
                >
                  {t.avatar.male}
                </button>
              </div>
            )
          )}

          {currentTab === "glasses" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {AVATAR_GLASSES.map((g) => (
                <VisualTile
                  key={g.id}
                  selected={value.glasses === g.id}
                  onClick={() => updateField("glasses", g.id)}
                  title={g.label}
                  isNone={g.id === "none"}
                >
                  <PixelAvatar
                    config={{ ...value, glasses: g.id, hat: "none" }}
                    size={52}
                    crop="glasses"
                  />
                </VisualTile>
              ))}
            </div>
          )}

          {currentTab === "hat" && (
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_HATS.map((hat) => (
                <VisualTile
                  key={hat.id}
                  selected={value.hat === hat.id}
                  onClick={() => updateField("hat", hat.id)}
                  title={hat.label}
                  isNone={hat.id === "none"}
                >
                  <PixelAvatar config={{ ...value, hat: hat.id }} size={48} crop="head" />
                </VisualTile>
              ))}
            </div>
          )}

          {currentTab === "outfit" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-pixel text-[10px] uppercase tracking-wider text-[#5d4037]">
                  {t.avatar.topLabel}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_TOPS.map((top) => (
                    <VisualTile
                      key={top.id}
                      selected={value.top === top.id}
                      onClick={() => updateField("top", top.id)}
                      title={top.label}
                    >
                      <PixelAvatar config={{ ...value, top: top.id }} size={46} crop="torso" />
                    </VisualTile>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-pixel text-[10px] uppercase tracking-wider text-[#5d4037]">
                  {t.avatar.bottomLabel}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_BOTTOMS.map((bot) => (
                    <VisualTile
                      key={bot.id}
                      selected={value.bottom === bot.id}
                      onClick={() => updateField("bottom", bot.id)}
                      title={bot.label}
                    >
                      <PixelAvatar config={{ ...value, bottom: bot.id }} size={44} crop="legs" />
                    </VisualTile>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-pixel text-[10px] uppercase tracking-wider text-[#5d4037]">
                  {t.avatar.shoesLabel}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_SHOES.map((shoe) => (
                    <VisualTile
                      key={shoe.id}
                      selected={value.shoes === shoe.id}
                      onClick={() => updateField("shoes", shoe.id)}
                      title={shoe.label}
                    >
                      <PixelAvatar config={{ ...value, shoes: shoe.id }} size={44} crop="shoes" />
                    </VisualTile>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {onSave && (
          <button
            type="button"
            onClick={() => onSave(value, encodedId)}
            className="lg:hidden pixel-btn pixel-btn-red w-full py-3 px-4 font-pixel text-xs flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {effectiveSaveLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function VisualTile({
  selected,
  onClick,
  title,
  isNone = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  isNone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`relative aspect-square border-2 flex items-center justify-center p-1 transition-transform ${
        selected
          ? "border-[#b91c1c] bg-[#fef3c7] scale-[1.04] shadow-[3px_3px_0_#2b1b17]"
          : "border-[#2b1b17] bg-[#faf3e0] hover:bg-[#f4e4bc]"
      }`}
    >
      {children}
      {isNone && (
        <span className="absolute bottom-1 right-1 bg-[#faf3e0] border border-[#2b1b17] p-0.5 text-[#b91c1c]">
          <Ban size={10} />
        </span>
      )}
      {selected && (
        <span className="absolute top-1 right-1 bg-[#b91c1c] text-white p-0.5">
          <Check size={10} />
        </span>
      )}
    </button>
  );
}
