"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useNsgramAuth } from "./NsgramAuthProvider";

const pageTitles: Record<string, { label: string; emoji: string }> = {
  "/nsgram/home":     { label: "Home",     emoji: "🏠" },
  "/nsgram/search":   { label: "Search",   emoji: "🔍" },
  "/nsgram/messages": { label: "Messages", emoji: "💬" },
  "/nsgram/profile":  { label: "Profile",  emoji: "👤" },
};

export default function NsgramHeader() {
  const pathname = usePathname();
  const { profile } = useNsgramAuth();

  const page = pageTitles[pathname] ?? { label: "Nsgram", emoji: "✨" };

  return (
    <header
      className="
        fixed top-0 left-0 right-0
        md:left-64
        h-14
        flex items-center justify-between
        px-4 sm:px-6
        border-b border-white/8
        bg-slate-950/80 backdrop-blur-xl
        z-20
      "
    >
      {/* Left — page title */}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none select-none">{page.emoji}</span>
        <h1 className="text-sm font-bold text-white tracking-wide">{page.label}</h1>
      </div>

      {/* Right — user avatar badge */}
      {profile && (
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">{profile.displayName}</p>
            <p className="text-[10px] text-brand-400 leading-tight">@{profile.username}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base select-none shrink-0">
            {profile.avatar === "girl" ? "👧" : "👦"}
          </div>
        </div>
      )}
    </header>
  );
}
