"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase";
import AuroraBackground from "@/components/AuroraBackground";
import type { GalleryPhoto } from "@/types";

export default function SinglePhotoClientPage({ photo }: { photo: GalleryPhoto }) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConfigured || !auth) {
      setAuthChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

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
      {/* Dynamic Aurora background */}
      <AuroraBackground />

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

        {authUser && authUser.emailVerified && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-brand-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            {copied ? "✓ Copied Photo Link" : "🔗 Share Photo"}
          </button>
        )}
      </div>

      {/* Auth Checking Loading State */}
      {authChecking ? (
        <div className="max-w-md mx-auto px-5 py-24 text-center">
          <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-mono text-brand-400">Verifying access...</p>
        </div>
      ) : (!authUser || !authUser.emailVerified) ? (
        /* ── Login / Signup Required Wall ── */
        <div className="max-w-xl mx-auto px-5 sm:px-8 mt-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 border border-accent/20 text-accent mb-4 font-mono">
              🔒 Members-Only Memory
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Log In to View This Memory
            </h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed mb-8">
              Please log in or create a free account to view this exclusive memory and its behind-the-scenes story.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href={`/login?redirect=/gallery/${photo.id}`}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              >
                Log In to View →
              </Link>
              <Link
                href={`/login?mode=signup&redirect=/gallery/${photo.id}`}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all hover:scale-[1.02]"
              >
                Create Free Account
              </Link>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs font-mono text-brand-400">
              <span>✨ 100% Free</span>
              <span className="text-white/20">•</span>
              <span>⚡ Instant Access</span>
              <span className="text-white/20">•</span>
              <span>📸 Full HD Memories</span>
            </div>
          </div>
        </div>
      ) : (
        /* Photo Frame & Story Card */
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/8 bg-brand-900/20 shadow-2xl space-y-0">
          {/* Large Image Container with 4 Protections */}
          <div
            className="relative w-full bg-black/40 flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden"
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={photo.imageUrl}
              alt={`${photo.title} — Nishant Kumar (hiiinishant) ${photo.category}`}
              title={photo.title}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="w-full max-h-[75vh] object-contain rounded-2xl select-none pointer-events-none"
            />

            {/* Transparent Protection Overlay */}
            <div
              className="absolute inset-0 z-10 select-none"
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Visible Watermark — Hii Nishant */}
            <div className="absolute bottom-5 right-5 z-20 pointer-events-none select-none flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-white/90 tracking-widest border border-white/15 shadow-2xl">
              <span className="text-accent">✦</span>
              <span>Hii Nishant</span>
            </div>

            <span className="absolute top-6 left-6 z-20 bg-black/75 backdrop-blur-md border border-white/10 text-accent text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl pointer-events-none select-none">
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
      )}
    </div>
  );
}
