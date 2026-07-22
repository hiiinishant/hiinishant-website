"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Newsletter from "@/components/Newsletter";
import TodaysVisitors from "@/components/layout/TodaysVisitors";
import { socialLinks } from "@/data/site";
import type { SocialPlatform } from "@/types";

/* ─────────────────────────────────────────────
   Platform-specific colours for social buttons
───────────────────────────────────────────── */
const platformColor: Record<SocialPlatform, string> = {
  twitter:   "hover:bg-white/10 hover:text-white hover:border-white/20",
  linkedin:  "hover:bg-[#0077b5]/15 hover:text-[#0077b5] hover:border-[#0077b5]/30",
  instagram: "hover:bg-[#e1306c]/15 hover:text-[#e1306c] hover:border-[#e1306c]/30",
  youtube:   "hover:bg-[#ff0000]/15 hover:text-[#ff0000] hover:border-[#ff0000]/30",
  github:    "hover:bg-[#af9cfc]/10 hover:text-[#af9cfc] hover:border-[#6e5494]/30",
  medium:    "hover:bg-[#00ab6c]/15 hover:text-[#00ab6c] hover:border-[#00ab6c]/30",
  quora:     "hover:bg-[#b92b27]/15 hover:text-[#b92b27] hover:border-[#b92b27]/30",
  telegram:  "hover:bg-[#0088cc]/15 hover:text-[#0088cc] hover:border-[#0088cc]/30",
  facebook:  "hover:bg-[#1877f2]/15 hover:text-[#1877f2] hover:border-[#1877f2]/30",
  snapchat:  "hover:bg-[#fffc00]/10 hover:text-[#fffc00] hover:border-[#fffc00]/20",
  email:     "hover:bg-accent/15 hover:text-accent hover:border-accent/30",
  website:   "hover:bg-accent/15 hover:text-accent hover:border-accent/30",
};

/* Only these platforms appear in the footer */
const footerPlatforms: SocialPlatform[] = [
  "youtube",
  "instagram",
  "twitter",
  "linkedin",
  "facebook",
  "website",
];

const socialIconMap: Record<SocialPlatform, React.ReactNode> = {
  twitter: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  github: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
    </svg>
  ),
  medium: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.54 12a6.8 6.8 0 11-13.54 0 6.8 6.8 0 0113.54 0zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM23.97 12c0 3.26-.31 5.9-1.07 5.9-.76 0-1.07-2.64-1.07-5.9s.31-5.9 1.07-5.9c.76 0 1.07 2.64 1.07 5.9z" />
    </svg>
  ),
  quora: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.016 19.387c-1.396.65-2.923.99-4.502.99-4.887 0-8.874-3.882-8.874-8.625S5.627 3.125 10.514 3.125s8.873 3.882 8.873 8.627c0 2.213-.865 4.23-2.298 5.766l2.36 2.373a.855.855 0 01-.131 1.328.905.905 0 01-1.127-.118l-4.175-4.714zm-3.502.261c3.55 0 6.44-2.812 6.44-6.275s-2.89-6.276-6.44-6.276-6.44 2.813-6.44 6.276 2.89 6.275 6.44 6.275zm2.936-3.864s.345.928-.27 1.545c-.613.618-1.545.271-1.545.271s.755-1.098 1.157-1.428c.403-.33.658-.388.658-.388z" />
    </svg>
  ),
  telegram: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  facebook: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
    </svg>
  ),
  snapchat: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.943 11.526c-.111-.303-.323-.465-.564-.599a1 1 0 0 0-.123-.064l-.219-.111c-.752-.399-1.339-.902-1.746-1.498a3.4 3.4 0 0 1-.3-.531c-.034-.1-.032-.156-.008-.207a.3.3 0 0 1 .097-.1c.129-.086.262-.173.352-.231.162-.104.289-.187.371-.245.309-.216.525-.446.66-.702a1.4 1.4 0 0 0 .069-1.16c-.205-.538-.713-.872-1.329-.872a1.8 1.8 0 0 0-.487.065c.006-.368-.002-.757-.035-1.139-.116-1.344-.587-2.048-1.077-2.61a4.3 4.3 0 0 0-1.095-.881C9.764.216 8.92 0 7.999 0s-1.76.216-2.505.641c-.412.232-.782.53-1.097.883-.49.562-.96 1.267-1.077 2.61-.033.382-.04.772-.036 1.138a1.8 1.8 0 0 0-.487-.065c-.615 0-1.124.335-1.328.873a1.4 1.4 0 0 0 .067 1.161c.136.256.352.486.66.701.082.058.21.14.371.246l.339.221a.4.4 0 0 1 .109.11c.026.053.027.11-.012.217a3.4 3.4 0 0 1-.295.52c-.398.583-.968 1.077-1.696 1.472-.385.204-.786.34-.955.8-.128.348-.044.743.28 1.075q.18.189.409.31a4.4 4.4 0 0 0 1 .4.7.7 0 0 1 .202.09c.118.104.102.26.259.488q.12.178.296.3c.33.229.701.243 1.095.258.355.014.758.03 1.217.18.19.064.389.186.618.328.55.338 1.305.802 2.566.802 1.262 0 2.02-.466 2.576-.806.227-.14.424-.26.609-.321.46-.152.863-.168 1.218-.181.393-.015.764-.03 1.095-.258a1.14 1.14 0 0 0 .336-.368c.114-.192.11-.327.217-.42a.6.6 0 0 1 .19-.087 4.5 4.5 0 0 0 1.014-.404c.16-.087.306-.2.429-.336l.004-.005c.304-.325.38-.709.256-1.047"/>
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  website: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.6 9h16.8M3.6 15h16.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
    </svg>
  ),
};

const navPages = [
  { href: "/", label: "Home" },
  { href: "/resume", label: "Resume" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/journey", label: "Journey" },
  { href: "/quiz", label: "Daily Quiz" },
  { href: "/privacy", label: "Privacy Policy" },
];

const navSections = [
  { href: "/journey", label: "Journey Timeline" },
  { href: "/projects", label: "Startups & Initiatives" },
  { href: "/universe", label: "Social Media" },
  { href: "/updates", label: "Latest Updates" },
];

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname?.startsWith("/nsgram")) {
    return null;
  }

  return (
    <footer className="relative mt-0 overflow-hidden">
      {/* Top glowing border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      {/* Subtle background glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-accent/4 blur-[120px] pointer-events-none -z-10" />

      {/* ─── MAIN FOOTER GRID ─── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-5">
        <div className="space-y-10 mb-8 lg:grid lg:grid-cols-12 lg:gap-10 lg:space-y-0">

          {/* Brand column — always full width on mobile */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 group mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-bold text-black text-sm transition-transform duration-300 group-hover:scale-110 glow-sm shrink-0">
                NK
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-white group-hover:text-accent transition-colors duration-300">
                  Nishant Kumar
                </span>
                <span className="block text-[11px] text-brand-500 font-medium">
                  Founder · Educator · Builder
                </span>
              </div>
            </Link>

            <p className="text-sm text-brand-400 leading-relaxed max-w-xs mb-6">
              Founder of{" "}
              <a
                href="https://2amstudy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-medium hover:text-accent transition-colors duration-300"
              >
                2 AM Study
              </a>{" "}
              — an educational initiative empowering students to learn smarter and achieve more.
            </p>

            {/* Social icons row — filtered to footer-only platforms */}
            <div className="flex flex-wrap gap-2 mb-4">
              {socialLinks
                .filter((link) => footerPlatforms.includes(link.platform))
                .map((link) => (
                <a
                  key={link.platform}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className={`w-9 h-9 rounded-lg border border-white/8 bg-white/4 flex items-center justify-center text-brand-400 transition-all duration-300 ${platformColor[link.platform]}`}
                >
                  {socialIconMap[link.platform]}
                </a>
              ))}
            </div>

            {/* YouTube Callouts */}
            <div className="space-y-1.5 mb-2">
              <a
                href="https://youtube.com/@hiiinishant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-brand-300 hover:text-white transition-colors duration-300 group/yt max-w-xs block"
              >
                <span>🎥 Follow my life journey on YouTube — <span className="font-semibold text-white group-hover/yt:text-accent transition-colors">Hiii Nishant ❤️</span></span>
              </a>

              <a
                href="https://youtube.com/@2amstudy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-brand-300 hover:text-white transition-colors duration-300 group/yt2 max-w-xs block"
              >
                <span>🎥 Follow for daily study motivation — <span className="font-semibold text-white group-hover/yt2:text-accent transition-colors">2 AM Study ❤️</span></span>
              </a>
            </div>

            {/* Inspirational Quote */}
            <p className="mt-2 text-[12px] italic text-brand-300 leading-relaxed font-medium max-w-xs">
              &ldquo;Success isn&apos;t just my dream; it&apos;s the <span className="text-amber-300 font-semibold not-italic">smile I want to see on my parents&apos; faces.</span>&rdquo;
            </p>
          </div>

          {/* Pages + Explore — 2 columns on mobile, separate on desktop */}
          <div className="grid grid-cols-2 gap-6 lg:contents">
            <div className="lg:col-span-2 lg:col-start-5">
              <h4 className="text-[11px] font-bold text-brand-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-4 h-px bg-accent/60 inline-block" />
                Pages
              </h4>
              <ul className="space-y-3">
                {navPages.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-brand-400 hover:text-white transition-colors duration-300"
                    >
                      <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-300 shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 lg:col-start-7">
              <h4 className="text-[11px] font-bold text-brand-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-4 h-px bg-accent/60 inline-block" />
                Explore
              </h4>
              <ul className="space-y-3">
                {navSections.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-brand-400 hover:text-white transition-colors duration-300"
                    >
                      <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-300 shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter — full width on mobile */}
          <div className="lg:col-span-4 lg:col-start-9">
            <h4 className="text-[11px] font-bold text-brand-300 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-accent/60 inline-block" />
              Stay in the Loop
            </h4>
            <h3 className="text-lg font-bold text-white mb-2">
              Get updates that actually <span className="text-gradient">matter.</span>
            </h3>
            <p className="text-xs text-brand-400 mb-4 leading-relaxed">
              New posts, resources, and what&apos;s being built — straight to your inbox. No spam, ever.
            </p>
            <div className="w-full">
              <Newsletter variant="inline" />
              <p className="text-[10px] text-brand-400 mt-2 text-center lg:text-left">
                Join 2,000+ students &amp; builders. Unsubscribe anytime.
              </p>
              <TodaysVisitors />
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="relative pt-5">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Copyright & Legal */}
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs text-brand-500 text-center sm:text-left">
                &copy; {year} Nishant Kumar. All rights reserved.
              </p>
              <span className="text-brand-700 hidden sm:inline">·</span>
              <Link
                href="/privacy"
                className="text-xs text-brand-400 hover:text-white transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <span className="text-brand-700 hidden sm:inline">·</span>
              <p className="text-xs text-brand-600 hidden sm:block">
                Designed &amp; built with purpose.
              </p>
            </div>


            {/* Back to top */}
            <a
              href="#"
              className="group flex items-center gap-1.5 text-xs text-brand-500 hover:text-white transition-colors duration-300"
            >
              Back to top
              <svg
                className="w-3.5 h-3.5 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
