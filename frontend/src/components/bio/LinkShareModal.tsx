"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Share2, ExternalLink } from "lucide-react";
import { BioLink } from "@/types/bio";
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
  onClose: () => void;
}

export default function LinkShareModal({ link, onClose }: LinkShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

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
    }
  }, [link.title, link.url]);

  // Social share URLs
  const encodedUrl = encodeURIComponent(link.url);
  const encodedTitle = encodeURIComponent(link.title);

  const shareChannels = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-[#25d366]/15 hover:border-[#25d366]/40 hover:text-[#25d366]",
      icon: (
        <svg className="w-5 h-5 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.815.814 2.8.814 3.18 0 5.765-2.586 5.766-5.766 0-3.18-2.586-5.767-5.77-5.767zm7.625 5.766c-.001 4.208-3.424 7.632-7.625 7.632-.937 0-1.826-.17-2.65-.494l-3.722.977.994-3.633c-.416-.893-.654-1.892-.654-2.85 0-4.208 3.424-7.632 7.625-7.632 4.201 0 7.632 3.424 7.632 7.368z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-white/10 hover:border-white/30 hover:text-white",
      icon: <TwitterIcon className="w-4 h-4 text-white" />,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877f2]/15 hover:border-[#1877f2]/40 hover:text-[#1877f2]",
      icon: <FacebookIcon className="w-4 h-4 text-[#1877f2]" />,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:bg-[#0077b5]/15 hover:border-[#0077b5]/40 hover:text-[#0077b5]",
      icon: <LinkedInIcon className="w-4 h-4 text-[#0077b5]" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${link.title}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl p-6 relative animate-slideUp sm:animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold text-white tracking-tight">Share this link</h3>
          <button
            onClick={onClose}
            aria-label="Close share modal"
            className="p-1.5 rounded-full text-brand-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            autoFocus
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Link Card Preview */}
        <div className="rounded-2xl bg-zinc-900/80 border border-white/10 p-3.5 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {renderBioIcon(link.icon, "w-5 h-5")}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{link.title}</h4>
            <p className="text-[11px] text-brand-400 font-mono truncate">{link.url}</p>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-brand-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Open link in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mb-4 ${
            copied
              ? "bg-emerald-500 text-black shadow-emerald-500/20"
              : "bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-98"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* Social Share Grid */}
        <div className="space-y-2 mb-4">
          <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider">
            Share directly
          </p>
          <div className="grid grid-cols-2 gap-2">
            {shareChannels.map((ch) => (
              <a
                key={ch.name}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2.5 px-3 rounded-xl bg-zinc-900/60 border border-white/10 text-xs font-semibold text-brand-300 transition-all flex items-center gap-2.5 cursor-pointer ${ch.color}`}
              >
                {ch.icon}
                <span className="truncate">{ch.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Native share on mobile */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>More Sharing Options...</span>
          </button>
        )}
      </div>
    </div>
  );
}
