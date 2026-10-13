"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { X, Copy, Check, Share2, ExternalLink, Mail, MoreHorizontal, Flag } from "lucide-react";
import {
  renderBioIcon,
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
} from "@/components/bio/BioIcons";

export interface ShareableLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface LinkShareModalProps {
  link: ShareableLink;
  username: string;
  onClose: () => void;
}

export default function LinkShareModal({ link, username, onClose }: LinkShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Parse link domain and high-res favicon for preview pic
  const { domain, faviconUrl } = useMemo(() => {
    try {
      const raw = link.url.startsWith("http://") || link.url.startsWith("https://")
        ? link.url
        : `https://${link.url}`;
      const parsed = new URL(raw);
      return {
        domain: parsed.hostname.replace(/^www\./, ""),
        faviconUrl: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`,
      };
    } catch {
      return { domain: link.url, faviconUrl: null };
    }
  }, [link.url]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setCanNativeShare(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [link.url]);

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: link.title,
          url: link.url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  }, [link.title, link.url, handleCopy]);

  // Social share URLs
  const encodedUrl = encodeURIComponent(link.url);
  const encodedTitle = encodeURIComponent(link.title);

  const socialChannels = [
    {
      name: "X",
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bg: "bg-black/60 hover:bg-black/80 border-white/15",
      icon: <TwitterIcon className="w-5 h-5 text-white" />,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer.php?u=${encodedUrl}`,
      bg: "bg-[#1877f2]/10 hover:bg-[#1877f2]/20 border-[#1877f2]/30",
      icon: <FacebookIcon className="w-5 h-5 text-[#1877f2]" />,
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`,
      bg: "bg-[#25d366]/10 hover:bg-[#25d366]/20 border-[#25d366]/30",
      icon: (
        <svg className="w-5 h-5 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.815.814 2.8.814 3.18 0 5.765-2.586 5.766-5.766 0-3.18-2.586-5.767-5.77-5.767zm7.625 5.766c-.001 4.208-3.424 7.632-7.625 7.632-.937 0-1.826-.17-2.65-.494l-3.722.977.994-3.633c-.416-.893-.654-1.892-.654-2.85 0-4.208 3.424-7.632 7.625-7.632 4.201 0 7.632 3.424 7.632 7.368z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      bg: "bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border-[#0077b5]/30",
      icon: <LinkedInIcon className="w-5 h-5 text-[#0077b5]" />,
    },
    {
      name: "Messenger",
      href: `https://www.messenger.com/new`,
      bg: "bg-[#0084ff]/10 hover:bg-[#0084ff]/20 border-[#0084ff]/30",
      icon: (
        <svg className="w-5 h-5 text-[#0084ff]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.45 5.518 3.717 7.195V22l3.373-1.851c.928.257 1.91.396 2.91.396 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.006 12.443l-2.55-2.72-4.978 2.72 5.474-5.811 2.613 2.72 4.915-2.72-5.474 5.811z" />
        </svg>
      ),
    },
    {
      name: "Snapchat",
      href: `https://www.snapchat.com/share?url=${encodedUrl}`,
      bg: "bg-[#fffc00]/10 hover:bg-[#fffc00]/20 border-[#fffc00]/30",
      icon: (
        <svg className="w-5 h-5 text-[#fffc00]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.164 2c3.155 0 5.454 2.155 5.525 5.163.024 1.02-.303 2.083-.303 2.083s.427.058.694.394c.264.332.222.846-.067 1.157-.354.382-1.077.585-1.077.585s.551.986 1.455 1.503c.904.516 1.623.519 2.028.966.425.469.313 1.258-.893 1.696-1.57.57-3.238.169-3.791.73-.553.562-.27 1.76-1.815 2.148-1.545.389-1.802-.55-1.802-.55s-.45.925-1.956.925c-1.506 0-1.956-.925-1.956-.925s-.257.939-1.802.55c-1.545-.388-1.262-1.586-1.815-2.148-.553-.561-2.221-.16-3.791-.73-1.206-.438-1.318-1.227-.893-1.696.405-.447 1.124-.45 2.028-.966.904-.517 1.455-1.503 1.455-1.503s-.723-.203-1.077-.585c-.289-.311-.331-.825-.067-1.157.267-.336.694-.394.694-.394s-.327-1.063-.303-2.083C6.71 4.155 9.009 2 12.164 2z" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent("Check out this link on Hiii Nishant!")}&body=${encodeURIComponent(link.title + " - " + link.url)}`,
      bg: "bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30",
      icon: <Mail className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share link - ${link.title}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-zinc-950 border border-white/10 shadow-2xl p-6 relative animate-slideUp sm:animate-scaleIn scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        {/* 1. Header: Share link (Centered) + Close Button */}
        <div className="relative flex items-center justify-center mb-5 min-h-[36px]">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight text-center">
            Share link
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-brand-300 hover:text-white transition-colors cursor-pointer"
            autoFocus
          >
            <span>Close</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Link Preview Card (Pic Thumbnail + Title + Domain & URL + External Link) */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 border border-white/10 hover:border-white/20 p-3.5 sm:p-4 mb-4 transition-all"
        >
          <div className="flex items-center gap-3.5">
            {/* Picture / Thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform p-2">
              {faviconUrl && !imgError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={faviconUrl}
                  alt={link.title}
                  onError={() => setImgError(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                />
              ) : (
                renderBioIcon(link.icon, "w-6 h-6 sm:w-7 sm:h-7")
              )}
            </div>

            {/* Link Information */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-accent transition-colors leading-snug">
                {link.title}
              </h4>
              <p className="text-xs text-brand-300 font-mono truncate mt-0.5">
                {domain}
              </p>
              <p className="text-[11px] text-brand-500 font-mono truncate mt-0.5">
                {link.url}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
              <ExternalLink className="w-4 h-4 text-brand-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </a>

        {/* 3. Copy Link Action */}
        <button
          onClick={handleCopy}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mb-6 ${
            copied
              ? "bg-emerald-500 text-black shadow-emerald-500/20"
              : "bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-98"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Link copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy link</span>
            </>
          )}
        </button>

        {/* 4. Social Sharing Channels (Horizontal row/grid matching Linktree) */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            {socialChannels.map((ch) => (
              <a
                key={ch.name}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 cursor-pointer"
                aria-label={`Share on ${ch.name}`}
              >
                <div
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${ch.bg}`}
                >
                  {ch.icon}
                </div>
                <span className="text-[11px] font-medium text-brand-300 group-hover:text-white truncate max-w-full">
                  {ch.name}
                </span>
              </a>
            ))}

            {/* "More" button for device native share */}
            <button
              onClick={handleNativeShare}
              className="group flex flex-col items-center gap-1.5 cursor-pointer"
              aria-label="More sharing options"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm text-white">
                {canNativeShare ? <Share2 className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-medium text-brand-300 group-hover:text-white">
                More
              </span>
            </button>
          </div>
        </div>

        {/* 5. Linktree-style Viral Growth Card: Join [username] on Hiii Nishant */}
        <div className="rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 p-5 mb-5 space-y-3.5">
          <div>
            <h4 className="text-sm font-extrabold text-white">
              Join {username} on Hiii Nishant
            </h4>
            <p className="text-xs text-brand-300 mt-1 leading-relaxed">
              Get your own free Hiii Nishant. The only link in bio designed for creators and builders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <Link
              href="/signup?redirect=/dashboard"
              className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-black font-extrabold text-xs text-center transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-98"
            >
              Sign up free
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-brand-300 hover:text-white font-semibold text-xs text-center transition-all cursor-pointer"
            >
              Find out more
            </Link>
          </div>
        </div>

        {/* 6. Report link */}
        <div className="text-center pt-1">
          <a
            href={`mailto:support@hiiinishant.com?subject=Report%20Link%20on%20hiiinishant.com/${encodeURIComponent(username)}&body=I%20would%20like%20to%20report%20this%20link:%0A%0ATitle:%20${encodedTitle}%0AURL:%20${encodedUrl}%0AFrom%20Profile:%20https://hiiinishant.com/${encodeURIComponent(username)}`}
            className="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-300 transition-colors"
          >
            <Flag className="w-3 h-3" />
            <span>Report link</span>
          </a>
        </div>
      </div>
    </div>
  );
}
