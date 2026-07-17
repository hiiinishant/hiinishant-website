"use client";

import { useState, useEffect } from "react";
import { Link, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:bg-white/10 hover:text-white",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: "hover:bg-[#0077b5]/15 hover:text-[#0077b5]",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: "hover:bg-[#1877f2]/15 hover:text-[#1877f2]",
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.993 11.457.993c-5.437 0-9.863 4.371-9.867 9.8.001 2.13.558 4.21 1.624 6.079L2.14 21.28l4.507-1.226zM15.358 12.4c-.208-.104-1.233-.609-1.423-.679-.19-.07-.33-.104-.469.104-.139.208-.538.68-.659.817-.121.139-.243.156-.45.052-1.031-.515-1.731-.837-2.42-2.015-.224-.383-.07-.33.056-.479.112-.134.243-.287.365-.43.121-.143.161-.243.243-.404.082-.165.041-.31-.02-.414-.06-.104-.469-1.13-.642-1.547-.169-.408-.337-.35-.469-.357-.121-.007-.26-.009-.4-.009s-.365.052-.556.26c-.19.208-.729.712-.729 1.737 0 1.024.746 2.013.85 2.152.104.139 1.467 2.24 3.553 3.14.496.214.883.342 1.185.438.498.158.951.135 1.309.082.399-.06 1.233-.504 1.406-.99.173-.486.173-.902.121-.99-.052-.088-.19-.139-.398-.243z"/>
        </svg>
      ),
      color: "hover:bg-[#25D366]/15 hover:text-[#25D366]",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
        Share this article
      </span>
      <div className="flex items-center gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-brand-400 border border-white/6 glass hover:border-white/10 transition-all duration-300 ${link.color}`}
            title={`Share on ${link.name}`}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={handleCopy}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-400 border border-white/6 glass hover:border-white/10 hover:bg-accent/10 hover:text-accent transition-all duration-300 relative group"
          title="Copy post link"
        >
          {copied ? <Check className="w-4 h-4 text-accent" /> : <Link className="w-4 h-4" />}
          {copied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-900 border border-accent/25 text-accent text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
              Copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
