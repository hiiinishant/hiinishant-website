"use client";
import { Fragment } from "react";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, User, LogOut, MessageCircle, LayoutDashboard } from "lucide-react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth, db, isConfigured } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getLoginUrlWithRedirect } from "@/lib/auth-redirect";

const navLinks = [
  { href: "/projects", label: "Startups", match: "/projects" },
  { href: "/updates", label: "Updates", match: "/updates" },
  { href: "/blog", label: "Blog", match: "/blog" },
  { href: "/quiz", label: "Quiz", match: "/quiz" },
  { href: "/music", label: "Music", match: "/music" },
];

const moreLinks = [
  { href: "/support", label: "❤️ Support", match: "/support" },
  { href: "/contact", label: "📩 Contact", match: "/contact" },
  { href: "/faq", label: "❓ FAQ", match: "/faq" },
  { href: "/privacy", label: "🔒 Privacy Policy", match: "/privacy" },
  { href: "/terms", label: "📜 Terms of Service", match: "/terms" },
];

function isActive(pathname: string, match: string) {
  if (match === "/") return pathname === "/";
  return pathname.startsWith(match);
}

/** Returns initials from a display name string or firebase user's email */
function getInitialsFromName(name: string | null | undefined, fallback: string): string {
  if (name && name.trim()) {
    return name.trim()
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return fallback.toUpperCase();
}

/** Returns the short display label (first name) */
function getShortName(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) return name.trim().split(" ")[0];
  return email?.split("@")[0] ?? "User";
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [clickedOpen, setClickedOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  // Nsgram profile — keeps name/avatar in sync after profile edits
  const [nsgramProfile, setNsgramProfile] = useState<{ displayName?: string; avatar?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      // Reset nsgram profile on auth change
      if (!user) setNsgramProfile(null);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for Nsgram profile (displayName + avatar)
  useEffect(() => {
    if (!authUser || !db || !isConfigured) return;
    const userDoc = doc(db, "users", authUser.uid);
    const unsubProfile = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNsgramProfile({ displayName: data.displayName, avatar: data.avatar });
      }
    });
    return () => unsubProfile();
  }, [authUser]);

  /* ─── More dropdown hover logic ─── */
  const handleMouseEnter = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setMoreOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => { setMoreOpen(false); setClickedOpen(false); }, 150);
  };
  const handleMoreClick = () => {
    if (!clickedOpen) { setMoreOpen(true); setClickedOpen(true); }
    else { setMoreOpen(false); setClickedOpen(false); }
  };

  /* ─── User dropdown hover logic ─── */
  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) { clearTimeout(userTimeoutRef.current); userTimeoutRef.current = null; }
    setUserMenuOpen(true);
  };
  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => setUserMenuOpen(false), 180);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setAuthUser(null);
      setUserMenuOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isMoreActive = moreLinks.some((l) => isActive(pathname, l.match));

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 10) setMobileOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false); setClickedOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Hide navbar on all NSGram pages */
  const [currentUrl, setCurrentUrl] = useState(pathname);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const full = (window.location.pathname + window.location.search + window.location.hash) || pathname;
      setCurrentUrl(full);
    }
  }, [pathname]);

  if (pathname?.startsWith("/nsgram")) return null;

  const authTargetUrl = getLoginUrlWithRedirect(currentUrl);

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
                  {active && <span className="absolute inset-0 rounded-lg bg-white/8 border border-white/10" />}
                  <span className="relative z-10">{link.label}</span>
                  {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />}
                </Link>
              );
            })}

            {/* ─── MORE ▼ DROPDOWN ─── */}
            <div
              className="relative ml-0.5"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={handleMoreClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors duration-200 cursor-pointer ${
                  isMoreActive || moreOpen
                    ? "text-white bg-white/8 border-white/10"
                    : "text-brand-300 hover:text-white hover:bg-white/5 border-transparent"
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full pt-2 w-48 z-50 animate-fadeIn">
                  <div
                    className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-1.5 backdrop-blur-xl"
                    style={{ background: "rgb(12,12,20)" }}
                  >
                    {moreLinks.map((link, idx) => {
                      const active = isActive(pathname, link.match);
                      const isLastGroup = idx === 3;
                      return (
                        <Fragment key={link.href + link.label}>
                          {isLastGroup && <div className="my-1 mx-2 border-t border-white/10" />}
                          <Link
                            href={link.href}
                            onClick={() => { setMoreOpen(false); setClickedOpen(false); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                              active ? "text-white bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/8"
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

            {/* ─── USER AVATAR / LOGIN ─── */}
            {authUser ? (
              <div
                className="relative ml-2"
                ref={userMenuRef}
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                    userMenuOpen
                      ? "text-white bg-white/8 border border-white/10"
                      : "hover:bg-white/8 border border-transparent hover:border-white/10"
                  }`}
                >
                  {/* Glowing Avatar Circle — shows Nsgram avatar emoji or initials */}
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-black text-xs font-extrabold shadow-[0_0_14px_rgba(245,158,11,0.35)] group-hover:shadow-[0_0_22px_rgba(245,158,11,0.55)] transition-shadow">
                      {nsgramProfile?.avatar
                        ? (nsgramProfile.avatar === "girl" ? "👧" : "👦")
                        : getInitialsFromName(nsgramProfile?.displayName ?? authUser.displayName, authUser.email?.[0] ?? "U")}
                    </div>
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[rgb(10,10,18)] shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                  </div>
                  {/* Name — prefer Nsgram display name over Firebase Auth name */}
                  <span className="text-sm font-semibold text-white max-w-[90px] truncate leading-none">
                    {getShortName(nsgramProfile?.displayName ?? authUser.displayName, authUser.email)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-brand-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-36 z-50 animate-fadeIn">
                    <div
                      className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-1.5 backdrop-blur-xl"
                      style={{ background: "rgb(12,12,20)" }}
                    >
                      <Link
                        href="/nsgram"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/8 transition-all duration-150"
                      >
                        <span>Nsgram</span>
                      </Link>
                      <div className="my-1 mx-2 border-t border-white/10" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 cursor-pointer text-left"
                      >
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={authTargetUrl}
                className="group ml-2 relative px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 overflow-hidden flex items-center gap-1.5"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer" />
              </Link>
            )}
          </div>

          {/* ─── Mobile controls ─── */}
          <div className="flex lg:hidden items-center gap-2">
            {authUser ? (
              <Link
                href="/nsgram/profile"
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-white/8 border border-white/10 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-amber-300 flex items-center justify-center text-black text-[11px] font-extrabold shrink-0">
                  {nsgramProfile?.avatar
                    ? (nsgramProfile.avatar === "girl" ? "👧" : "👦")
                    : getInitialsFromName(nsgramProfile?.displayName ?? authUser.displayName, authUser.email?.[0] ?? "U")}
                </div>
                <span className="text-xs font-semibold text-white max-w-[60px] truncate">
                  {getShortName(nsgramProfile?.displayName ?? authUser.displayName, authUser.email)}
                </span>
              </Link>
            ) : (
              <Link
                href={authTargetUrl}
                className="px-3.5 py-1.5 rounded-xl bg-accent text-black font-bold text-xs"
              >
                Login
              </Link>
            )}
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

      {/* ─── Mobile Menu (full-screen overlay) ─── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel — 60% wide, right-aligned */}
          <div className="relative z-10 mt-14 mr-3 mb-4 ml-auto w-[60%] rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[calc(100vh-5rem)] animate-fade-in">
            <div className="px-5 pb-6 pt-4 space-y-1">

              {/* Nav links */}
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

              {/* More section */}
              <div className="pt-3 pb-1 px-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-brand-500">More</p>
              </div>
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

              {/* Logout */}
              {authUser && (
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Logout
                </button>
              )}

              {/* Login */}
              {!authUser && (
                <Link
                  href={authTargetUrl}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] mt-2"
                >
                  Login
                </Link>
              )}

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
