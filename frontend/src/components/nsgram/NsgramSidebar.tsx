"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNsgramAuth } from "./NsgramAuthProvider";

export default function NsgramSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useNsgramAuth();

  const menuItems = [
    {
      label: "Home",
      href: "/nsgram/home",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Search",
      href: "/nsgram/search",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/nsgram/messages",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/nsgram/profile",
      icon: (
        <span className="text-xl leading-none flex items-center justify-center w-6 h-6 bg-white/10 rounded-full select-none border border-white/20">
          {profile?.avatar === "girl" ? "👧" : "👦"}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 border-r border-white/10 bg-slate-950 p-6 z-30">
        {/* Nsgram Logo/Title */}
        <div className="mb-8 px-2">
          <Link href="/nsgram/home" className="inline-flex items-center gap-2 group">
            <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-white transition-all duration-300">
              Nsgram
            </span>
          </Link>
          <span className="block text-[10px] text-brand-500 font-semibold tracking-widest uppercase mt-0.5">
            COMMUNITY PLATFORM
          </span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 border ${
                  isActive
                    ? "bg-amber-400/10 text-amber-300 border-amber-400/20 font-bold"
                    : "text-brand-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <div className={isActive ? "text-amber-300" : "text-brand-400"}>
                  {item.icon}
                </div>
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer/Logout Button */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-rose-400 border border-transparent hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-300"
          >
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-semibold tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-slate-950/90 backdrop-blur-lg flex items-center justify-around px-4 pb-safe z-30">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ${
                isActive ? "text-amber-300 scale-105" : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center flex-1 py-1 text-rose-400 transition-all duration-300 hover:text-rose-300"
          aria-label="Logout"
        >
          <div className="mb-0.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="text-[10px] font-medium tracking-wide">Logout</span>
        </button>
      </nav>
    </>
  );
}
