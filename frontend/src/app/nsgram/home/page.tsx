"use client";

import React from "react";
import Link from "next/link";
import { useNsgramAuth } from "@/components/nsgram/NsgramAuthProvider";

export default function NsgramHomePage() {
  const { profile } = useNsgramAuth();

  if (!profile) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header Hero */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/50 p-8 sm:p-10 shadow-2xl backdrop-blur">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-400/10 blur-[80px]" />
        
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
            Nsgram Workspace
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Welcome back, <span className="text-gradient font-black">{profile.displayName}</span>!
          </h1>
          <p className="mt-4 text-base text-brand-300 sm:text-lg leading-relaxed">
            Welcome to your clean, premium personal dashboard on Nsgram. Check messages, find other members, or update your space.
          </p>
        </div>
      </section>

      {/* Main Grid: Info + Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 backdrop-blur flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-wide border-b border-white/5 pb-3">
              Your Profile
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner select-none shrink-0">
                {profile.avatar === "girl" ? "👧" : "👦"}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white leading-tight">
                  {profile.displayName}
                </h3>
                <p className="text-sm text-brand-400">@{profile.username}</p>
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-brand-300 italic leading-relaxed pt-2">
                &ldquo;{profile.bio}&rdquo;
              </p>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
            <Link
              href="/nsgram/profile"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors duration-300"
            >
              Edit Profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Shortcuts / Quick Actions Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 backdrop-blur flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-wide border-b border-white/5 pb-3">
              Quick Navigation
            </h2>
            <div className="grid gap-3 pt-1">
              <Link
                href="/nsgram/search"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Search Directory</p>
                    <p className="text-xs text-brand-400">Discover and find other members</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/nsgram/messages"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Inbox Messages</p>
                    <p className="text-xs text-brand-400">Open active chat rooms</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-brand-500">
            <span>Server: Connected</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
