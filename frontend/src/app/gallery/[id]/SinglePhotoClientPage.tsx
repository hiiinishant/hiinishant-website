"use client";

import { useState } from "react";
import Link from "next/link";
import type { GalleryPhoto } from "@/types";

export default function SinglePhotoClientPage({ photo }: { photo: GalleryPhoto }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip py-10 px-5 sm:px-8">
      {/* Glow background */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Header bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <Link
          href="/gallery"
          className="flex items-center gap-2 text-brand-400 hover:text-white transition-colors group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest">Back to Gallery</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-brand-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
        >
          {copied ? "✓ Copied Photo Link" : "🔗 Share Photo"}
        </button>
      </div>

      {/* Photo Frame & Story Card */}
      <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/8 bg-brand-900/20 shadow-2xl space-y-0">
        {/* Large Image Container */}
        <div className="relative w-full bg-black/40 flex items-center justify-center p-2 sm:p-4">
          <img
            src={photo.imageUrl}
            alt={`${photo.title} — Nishant Kumar (hiiinishant) ${photo.category}`}
            title={photo.title}
            className="w-full max-h-[75vh] object-contain rounded-2xl"
          />
          <span className="absolute top-6 left-6 bg-black/75 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl">
            {photo.category}
          </span>
        </div>

        {/* Story Metadata */}
        <div className="p-6 sm:p-10 space-y-4 bg-zinc-950/60">
          <div className="flex items-center justify-between text-xs font-mono text-brand-500">
            <span>Date: {formatDate(photo.date)}</span>
            <span>By Nishant Kumar</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            {photo.title}
          </h1>

          {photo.story && (
            <p className="text-sm sm:text-base text-brand-300 leading-relaxed font-normal">
              {photo.story}
            </p>
          )}

          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-brand-500">
            <Link href="/gallery" className="hover:text-amber-400 transition-colors">
              🖼 Explore all Nishant&apos;s memories
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              📩 Get in touch →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
