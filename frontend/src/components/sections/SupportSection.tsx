"use client";

import Link from "next/link";
import {
  Heart,
  Rocket,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface SupportCardOption {
  id: string;
  icon: string;
  label: string;
  amountText: string;
  tagline: string;
  rzpUrl: string;
  popular?: boolean;
}

export const SUPPORT_CARD_OPTIONS: SupportCardOption[] = [
  {
    id: "coffee",
    icon: "☕",
    label: "Buy Me a Coffee",
    amountText: "₹49",
    tagline: "Quick caffeine boost for late-night coding",
    rzpUrl: "https://rzp.io/rzp/smaUjyB",
  },
  {
    id: "resources",
    icon: "📚",
    label: "Support Student Resources",
    amountText: "₹99",
    tagline: "Fund free GATE notes & practice quizzes",
    rzpUrl: "https://rzp.io/rzp/KoMO0lL",
    popular: true,
  },
  {
    id: "build",
    icon: "💛",
    label: "Help Build 2 AM Study",
    amountText: "₹199",
    tagline: "Help scale edtech infrastructure for thousands",
    rzpUrl: "https://rzp.io/rzp/2LgbKW02",
  },
  {
    id: "custom",
    icon: "❤️",
    label: "Contribute Any Amount",
    amountText: "Custom",
    tagline: "Every rupee directly supports free education",
    rzpUrl: "https://pages.razorpay.com/support-hiii-nishant",
  },
];

// 9 "Where Your Support Goes" items with optional links
const WHERE_GOES = [
  {
    emoji: "🎥",
    text: (
      <>
        Free educational content on the{" "}
        <a
          href="https://www.youtube.com/@2amstudy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-semibold"
        >
          2 AM Study YouTube channel
        </a>
        {" "}— helping aspirants stay motivated and focused.
      </>
    ),
  },
  {
    emoji: "📖",
    text: (
      <>
        Free{" "}
        <a
          href="https://2amstudy.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-semibold"
        >
          2 AM Study branded notebooks
        </a>
        {" "}through student giveaways and special initiatives.
      </>
    ),
  },
  {
    emoji: "🚀",
    text: (
      <>
        Continuous improvements to the{" "}
        <a
          href="https://2amstudy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-semibold"
        >
          2 AM Study platform
        </a>
        {" "}— better tools and richer student experience.
      </>
    ),
  },
  {
    emoji: "📝",
    text: "Free study notes, topic summaries, and revision sheets for aspirants.",
  },
  {
    emoji: "🧪",
    text: "Free mock tests and subject-wise quizzes — no subscription, no paywall.",
  },
  {
    emoji: "🌐",
    text: "Website hosting and server costs to keep Hiii Nishant and 2 AM Study running 24/7.",
  },
  {
    emoji: "💻",
    text: "Open student tools — planners, formula sheets, and productivity resources for exam prep.",
  },
  {
    emoji: "🎓",
    text: "Community events and outreach programs to help aspirants stay consistent.",
  },
  {
    emoji: "❤️",
    text: "A free, safe community for aspirants to connect, share, and grow together.",
  },
];

export default function SupportSection() {
  const handlePaymentLaunch = (card: SupportCardOption) => {
    if (card.rzpUrl) {
      window.open(card.rzpUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section id="support" className="relative pt-0 pb-16 sm:pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/4 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">

        {/* ── HEADER ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-3">
            <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>Support Independent Education</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            Support Hiii Nishant for Students
          </h1>
          <p className="text-brand-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Every contribution helps us create more free resources, build better student tools, improve the{" "}
            <a href="https://2amstudy.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">
              2 AM Study
            </a>{" "}
            platform, and make quality education more accessible for everyone. Thank you for being part of this mission. ❤️
          </p>
        </div>

        {/* ── SUPPORT TIER CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {SUPPORT_CARD_OPTIONS.map((card) => (
            <a
              key={card.id}
              href={card.rzpUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                handlePaymentLaunch(card);
              }}
              className={`relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group cursor-pointer ${card.popular
                ? "border-accent/40 bg-accent/8 shadow-[0_0_30px_rgba(245,158,11,0.12)] hover:border-accent hover:shadow-[0_0_35px_rgba(245,158,11,0.2)]"
                : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6"
                }`}
            >
              {card.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-accent text-black text-[9px] font-extrabold uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{card.icon}</span>
                  <span className="text-base font-black font-mono text-accent">{card.amountText}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-snug mb-1">
                  {card.label}
                </h3>
                <p className="text-xs text-brand-400 leading-tight">{card.tagline}</p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/8 flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
                <span>Contribute Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          ))}
        </div>

        {/* ── WHERE YOUR SUPPORT GOES ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Where Your Support Goes</h2>
          </div>
          <p className="text-brand-300 text-sm mb-8 leading-relaxed">
            Your contribution helps more students and aspirants get:
          </p>

          <div className="space-y-0 divide-y divide-white/5 border border-white/8 rounded-2xl overflow-hidden">
            {WHERE_GOES.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-4 bg-white/[0.015] hover:bg-white/[0.035] transition-colors"
              >
                <span className="text-xl shrink-0 mt-0.5">{item.emoji}</span>
                <p className="text-sm text-brand-200 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-brand-300 text-sm mt-6 leading-relaxed text-center">
            Every contribution directly helps us create more free opportunities, improve the{" "}
            <a href="https://2amstudy.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">
              2 AM Study
            </a>{" "}
            platform, and support students and aspirants across India. ❤️
          </p>
        </div>

        {/* ── ACTION ROW ── */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 mb-8">
          <Link
            href="https://2amstudy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 bg-white/3 text-white font-semibold text-xs sm:text-sm hover:bg-white/8 hover:border-white/25 transition-all duration-300 group"
          >
            <Rocket className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform" />
            <span>🚀 Explore 2 AM Study</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="https://2amstudy.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 bg-white/3 text-white font-semibold text-xs sm:text-sm hover:bg-white/8 hover:border-white/25 transition-all duration-300 group"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>🛍️ 2 AM Study Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="https://www.youtube.com/@2amstudy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 bg-white/3 text-white font-semibold text-xs sm:text-sm hover:bg-white/8 hover:border-white/25 transition-all duration-300 group"
          >
            <svg className="w-4 h-4 text-red-500 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>🎥 2 AM Study YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* Secure badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-brand-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Secure payments powered by Razorpay</span>
        </div>
      </div>
    </section>
  );
}
