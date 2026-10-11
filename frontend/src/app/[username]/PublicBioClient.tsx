"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, isConfigured } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { API_BASE } from "@/lib/api";
import {
  PublicBioProfile,
  BIO_THEMES,
  BUTTON_STYLES,
} from "@/types/bio";
import {
  ExternalLink,
  Share2,
  Check,
  Copy,
  Lock,
  Edit3,
  Send,
  MessageCircle,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  renderBioIcon,
  InstagramIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkedInIcon,
  GitHubIcon,
  TelegramIcon,
  SpotifyIcon,
} from "@/components/bio/BioIcons";

interface PublicBioClientProps {
  initialProfile: PublicBioProfile;
}

export default function PublicBioClient({ initialProfile }: PublicBioClientProps) {
  const profile = initialProfile;
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // 1. Observe auth state and resolve ownership by checking bio_pages collection
  useEffect(() => {
    if (!isConfigured || !auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsOwner(false);
        return;
      }
      // Check ownership: compare logged-in user's bio username with this page's username
      try {
        if (db) {
          const bioRef = doc(db, "bio_pages", user.uid);
          const bioSnap = await getDoc(bioRef);
          if (bioSnap.exists()) {
            const data = bioSnap.data();
            setIsOwner(data?.username === profile.username);
          } else {
            setIsOwner(false);
          }
        }
      } catch {
        setIsOwner(false);
      }
    });
    return () => unsub();
  }, [profile.username]);

  // 2. Track authentic page view once on mount (bot & refresh filtered on server)
  useEffect(() => {
    if (!profile.isPublished) return;
    const trackView = async () => {
      try {
        await fetch(`${API_BASE}/api/bio/${encodeURIComponent(profile.username)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // silent
      }
    };
    trackView();
  }, [profile.isPublished, profile.username]);

  // 3. Track link clicks
  const handleLinkClick = (linkId: string, url: string) => {
    try {
      fetch(`${API_BASE}/api/bio/${encodeURIComponent(profile.username)}/click/${encodeURIComponent(linkId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    } catch {
      // silent
    }
  };

  // 4. Share / Copy Link Action
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://hiiinishant.com/${profile.username}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} on Hiii Nishant`,
          text: profile.bio || `Check out ${profile.displayName}'s links!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareToast(true);
      setTimeout(() => {
        setCopied(false);
        setShareToast(false);
      }, 2500);
    }
  };

  const theme = useMemo(() => {
    return BIO_THEMES[profile.theme] || BIO_THEMES["dark-modern"];
  }, [profile.theme]);

  const buttonStyle = useMemo(() => {
    return BUTTON_STYLES[profile.buttonStyle] || BUTTON_STYLES["rounded"];
  }, [profile.buttonStyle]);

  // Case: Unpublished Profile
  if (!profile.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white">
        <div className="max-w-md w-full rounded-3xl bg-zinc-900/80 border border-white/10 p-8 shadow-2xl text-center backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Page Currently Unpublished</h1>
          <p className="text-sm text-brand-300 leading-relaxed mb-6">
            The profile for <span className="text-accent font-semibold">@{profile.username}</span> is in draft mode or being updated by the owner.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all"
            >
              <span>Are you the owner? Manage in Studio</span>
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-300 hover:text-white text-xs transition-all"
            >
              <span>Back to Hiii Nishant</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between relative selection:bg-accent/30 selection:text-white ${theme.backgroundClass}`}>
      {/* Toast popup */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="px-4 py-2.5 rounded-full bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Profile link copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Floating Top Header Controls */}
      <div className="w-full max-w-lg mx-auto px-5 pt-6 pb-2 flex items-center justify-between z-30">
        {/* Left: Quick Back / Brand link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-[11px] font-semibold text-white/70 hover:text-white backdrop-blur-md transition-all"
        >
          <span>HN</span>
          <span className="opacity-50">/</span>
          <span>hiiinishant.com</span>
        </Link>

        {/* Right: Share Button */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              href="/dashboard"
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-white/80 hover:text-white backdrop-blur-md transition-all"
              title="Edit your Bio Studio"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            title="Share Profile"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Bio Content Container */}
      <div className="w-full max-w-md mx-auto px-5 py-6 flex-grow flex flex-col justify-start">
        {/* Profile Card Header */}
        <div className="text-center mb-7">
          {/* Avatar Ring */}
          <div
            className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black overflow-hidden transition-transform duration-300 hover:scale-105 ${theme.avatarBorder}`}
            style={{ backgroundColor: theme.previewBg }}
          >
            {profile.avatarType === "girl" ? (
              <span>👧</span>
            ) : profile.avatarType === "boy" ? (
              <span>👦</span>
            ) : profile.avatarType === "custom" && profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                width={96}
                height={96}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={theme.accentClass}>
                {profile.displayName.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Display Name */}
          <h1 className={`text-2xl font-extrabold tracking-tight ${theme.textPrimary}`}>
            {profile.displayName}
          </h1>

          {/* Handle */}
          <p className={`text-xs font-mono font-semibold mt-1 opacity-80 ${theme.accentClass}`}>
            @{profile.username}
          </p>

          {/* Bio Headline */}
          {profile.bio && (
            <p className={`text-sm mt-3 leading-relaxed max-w-sm mx-auto font-normal ${theme.textSecondary}`}>
              {profile.bio}
            </p>
          )}

          {/* Social Icons Row */}
          {profile.socials && Object.values(profile.socials).some(Boolean) && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-1">
              {profile.socials.instagram && (
                <a
                  href={
                    profile.socials.instagram.startsWith("http")
                      ? profile.socials.instagram
                      : `https://instagram.com/${profile.socials.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4 text-[#e1306c]" />
                </a>
              )}

              {profile.socials.youtube && (
                <a
                  href={
                    profile.socials.youtube.startsWith("http")
                      ? profile.socials.youtube
                      : `https://youtube.com/${profile.socials.youtube}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="w-4 h-4 text-[#ff0000]" />
                </a>
              )}

              {profile.socials.twitter && (
                <a
                  href={
                    profile.socials.twitter.startsWith("http")
                      ? profile.socials.twitter
                      : `https://twitter.com/${profile.socials.twitter.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="w-4 h-4 text-white" />
                </a>
              )}

              {profile.socials.linkedin && (
                <a
                  href={
                    profile.socials.linkedin.startsWith("http")
                      ? profile.socials.linkedin
                      : `https://linkedin.com/in/${profile.socials.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon className="w-4 h-4 text-[#0077b5]" />
                </a>
              )}

              {profile.socials.github && (
                <a
                  href={
                    profile.socials.github.startsWith("http")
                      ? profile.socials.github
                      : `https://github.com/${profile.socials.github}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  <GitHubIcon className="w-4 h-4 text-white" />
                </a>
              )}

              {profile.socials.telegram && (
                <a
                  href={
                    profile.socials.telegram.startsWith("http")
                      ? profile.socials.telegram
                      : `https://t.me/${profile.socials.telegram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="Telegram"
                >
                  <Send className="w-4 h-4 text-[#0088cc]" />
                </a>
              )}

              {profile.socials.whatsapp && (
                <a
                  href={
                    profile.socials.whatsapp.startsWith("http")
                      ? profile.socials.whatsapp
                      : `https://wa.me/${profile.socials.whatsapp.replace(/[^0-9]/g, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-[#25d366]" />
                </a>
              )}

              {profile.socials.spotify && (
                <a
                  href={profile.socials.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="Spotify"
                >
                  <SpotifyIcon className="w-4 h-4 text-[#1db954]" />
                </a>
              )}

              {profile.socials.email && (
                <a
                  href={`mailto:${profile.socials.email}`}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Links Stack */}
        <div className="space-y-3.5 mb-12">
          {profile.links.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center opacity-60 text-xs">
              No public links published yet.
            </div>
          ) : (
            profile.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id, link.url)}
                className={`group w-full py-4 px-5 transition-all duration-300 flex items-center justify-between gap-3 ${buttonStyle.previewClass} ${theme.cardClass}`}
              >
                {/* Left: Platform Icon */}
                <div className="w-6 h-6 flex items-center justify-center opacity-85 group-hover:scale-110 group-hover:opacity-100 transition-all shrink-0">
                  {renderBioIcon(link.icon, "w-4 h-4")}
                </div>

                {/* Center: Title */}
                <span className="text-sm sm:text-base font-bold truncate text-center flex-1 leading-snug">
                  {link.title}
                </span>

                {/* Right: Small arrow */}
                <div className="w-6 h-6 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Bottom Viral Branding Pill */}
      <footer className="w-full text-center py-6 px-4 z-30">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 text-xs font-semibold text-white/70 hover:text-white backdrop-blur-md transition-all shadow-lg hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Made on Hiii Nishant</span>
          <span className="opacity-50">·</span>
          <span className="text-accent font-bold">Create Your Free Bio Link &rarr;</span>
        </Link>
      </footer>
    </div>
  );
}
