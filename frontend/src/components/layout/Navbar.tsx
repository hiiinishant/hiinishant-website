"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/projects", label: "Startups", match: "/projects" },
  { href: "/updates", label: "Updates", match: "/updates" },
  { href: "/universe", label: "Social Media", match: "/universe" },
  { href: "/blog", label: "Blog", match: "/blog" },
  { href: "/music", label: "Music", match: "/music" },
];

function isActive(pathname: string, match: string) {
  if (match === "/") return pathname === "/";
  return pathname.startsWith(match);
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        className={`lg:hidden overflow-hidden transition-all duration-400 ease-in-out ${mobileOpen ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-5 pb-6 pt-2 space-y-1 border-t border-white/5 bg-background/95 backdrop-blur-xl">
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
