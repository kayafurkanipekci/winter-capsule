"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Trophy, UserCheck, Users } from "lucide-react";
import AvatarCreator from "@/components/avatar/AvatarCreator";
import PixelAvatar from "@/components/avatar/PixelAvatar";
import PixelSprite from "@/components/PixelSprite";
import PixelCat from "@/components/PixelCat";
import {
  AvatarConfig,
  DEFAULT_AVATAR,
  decodeAvatarId,
  encodeAvatarId,
  generateRandomAvatar,
} from "@/lib/avatar";

export default function AvatarDemoPage() {
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("Anonim Misafir");
  const [idInput, setIdInput] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setAvatar(generateRandomAvatar());
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSaveDemo = (_config: AvatarConfig, encodedId: string) => {
    setSavedToast(`Demo onaylandı! DB ID: ${encodedId}`);
    setTimeout(() => setSavedToast(null), 4000);
  };

  const handleLoadFromId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim()) return;
    setAvatar(decodeAvatarId(idInput.trim()));
  };

  const guestAvatar = generateRandomAvatar(`guest:${guestName.trim() || "anon"}`);
  const friend1 = generateRandomAvatar("friend-ece");
  const friend2 = generateRandomAvatar("friend-mert");

  return (
    <main className="min-h-screen px-3 sm:px-4 py-5 sm:py-8 max-w-5xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="pixel-btn bg-[#f4e4bc] text-[#2b1b17] px-2.5 py-2 font-pixel text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Ana Sayfa</span>
          </Link>
          <div>
            <h1 className="font-pixel text-base sm:text-xl flex items-center gap-2">
              <PixelCat size={28} />
              Avatar Oluşturucu (Demo)
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="pixel-btn bg-[#f4e4bc] text-[#2b1b17] px-2.5 py-2 font-pixel text-xs flex items-center gap-1.5"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden sm:inline">{isDark ? "Aydınlık" : "Karanlık"}</span>
        </button>
      </header>

      {savedToast && (
        <div className="pixel-panel p-3 bg-[#dcfce7] text-[#14532d] font-pixel text-xs flex items-center gap-2">
          <UserCheck size={16} />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Main Avatar Creator (Clean Final-Product UI) */}
      <AvatarCreator
        value={avatar}
        onChange={setAvatar}
        onSave={handleSaveDemo}
        saveLabel="Karakteri Onayla (Demo)"
      />

      {/* Demo-only System Previews (won't appear inside final /create screen) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-95">
        <div className="pixel-panel p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-pixel text-xs uppercase text-[#5d4037]">
            <Trophy size={15} className="text-[#b45309]" />
            Sıralama Önizlemesi (Demo)
          </div>
          <div className="flex flex-col gap-2">
            {[
              { name: "Sen", cfg: avatar, score: "%100", self: true },
              { name: "Ece", cfg: friend1, score: "%85", self: false },
              { name: "Mert", cfg: friend2, score: "%70", self: false },
            ].map((row, idx) => (
              <div
                key={row.name}
                className={`flex items-center justify-between px-3 py-2 border-2 border-[#2b1b17] ${
                  row.self ? "bg-[#fef3c7]" : "bg-[#faf3e0]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-pixel text-xs w-5">#{idx + 1}</span>
                  <PixelAvatar config={row.cfg} size={32} />
                  <span className="font-pixel text-xs text-[#2b1b17]">{row.name}</span>
                </div>
                <span className="font-pixel text-xs text-[#15803d]">{row.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-panel p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-pixel text-xs uppercase text-[#5d4037]">
            <Users size={15} className="text-[#15803d]" />
            Misafir Atama & DB ID Testi (Demo)
          </div>

          <div className="pixel-inset p-3 flex items-center gap-3">
            <PixelAvatar config={guestAvatar} size={52} className="shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Misafir adı..."
                className="w-full px-2.5 py-1.5 text-xs bg-[#faf3e0] border-2 border-[#2b1b17] text-[#2b1b17]"
              />
              <span className="font-mono text-[10px] text-[#5d4037] truncate">
                Senin ID: {encodeAvatarId(avatar)}
              </span>
            </div>
          </div>

          <form onSubmit={handleLoadFromId} className="flex gap-2">
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="ID yapıştır (örn: v2:f:6:3:6:2:0:1:4:1:4:5)"
              className="flex-1 px-2.5 py-2 text-xs font-mono bg-[#faf3e0] border-2 border-[#2b1b17] text-[#2b1b17]"
            />
            <button
              type="submit"
              className="pixel-btn bg-[#e6d5aa] text-[#2b1b17] px-3 py-2 font-pixel text-xs shrink-0"
            >
              Yükle
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
