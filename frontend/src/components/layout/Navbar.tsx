"use client";
import { Fragment } from "react";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/projects", label: "Startups", match: "/projects" },
  { href: "/updates", label: "Updates", match: "/updates" },
  { href: "/blog", label: "Blog", match: "/blog" },
  { href: "/music", label: "Music", match: "/music" },
  { href: "/vlogs", label: "Vlogs", match: "/vlogs" },
];

const moreLinks = [
  { href: "/support", label: "❤️ Support", match: "/support" },
  { href: "/contact", label: "📩 Contact", match: "/contact" },
  { href: "/universe", label: "🌐 Social Links", match: "/universe" },
  { href: "/faq", label: "❓ FAQ", match: "/faq" },
  { href: "/privacy", label: "🔒 Privacy Policy", match: "/privacy" },
  { href: "/terms", label: "📜 Terms of Service", match: "/terms" },
];

function isActive(pathname: string, match: string) {
  if (match === "/") return pathname === "/";
  return pathname.startsWith(match);
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMoreActive = moreLinks.some(
    (l) => l.href !== "/universe" && isActive(pathname, l.match)
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 10) setMobileOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on all NSGram pages — they use their own sidebar nav
  if (pathname?.startsWith("/nsgram")) {
    return null;
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${scrolled
        ? "glass-strong border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.3)]"
        : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-black text-black text-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              NK
              <div className="absolute inset-0 rounded-xl bg-accent opacity-0 group-hover:opacity-20 blur-sm transition-opacity" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground hidden sm:block group-hover:text-white transition-colors">
              Nishant Kumar
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${active
                    ? "text-white"
                    : "text-brand-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-lg bg-white/8 border border-white/10" />
                  )}
                  <span className="relative z-10">{link.label}</span>
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}

            {/* ─── MORE ▼ DROPDOWN ─── */}
            <div className="relative ml-0.5" ref={dropdownRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isMoreActive || moreOpen
                    ? "text-white bg-white/8 border border-white/10"
                    : "text-brand-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Panel */}
              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50" style={{ background: 'rgb(10,10,18)' }}>
                  <div className="py-1.5">
                    {moreLinks.map((link, idx) => {
                      const active = isActive(pathname, link.match);
                      const isLastGroup = idx === 3; // separator before Privacy/Terms
                      return (
                        <Fragment key={link.href + link.label}>
                          {isLastGroup && (
                            <div className="my-1 mx-3 border-t border-white/10" />
                          )}
                          <Link
                            href={link.href}
                            onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                              active
                                ? "text-white bg-white/10"
                                : "text-zinc-200 hover:text-white hover:bg-white/8"
                            }`}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="group ml-2 relative px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10">Get in Touch</span>
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer" />
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/5 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col items-center justify-center gap-[5px]">
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-400 ease-in-out ${mobileOpen ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-5 pb-6 pt-2 space-y-1 border-t border-white/5 bg-background/95 backdrop-blur-xl">
          {/* Regular nav links */}
          {navLinks.map((link) => {
            const active = isActive(pathname, link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${active
                  ? "text-white bg-white/8 border border-white/10"
                  : "text-brand-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                {link.label}
              </Link>
            );
          })}

          {/* More section divider */}
          <div className="pt-2 pb-1 px-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-500">More</p>
          </div>

          {/* More links */}
          {moreLinks.map((link) => {
            const active = isActive(pathname, link.match);
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${active
                  ? "text-white bg-white/8 border border-white/10"
                  : "text-brand-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3">
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
