"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";

export default function LinkInBioCard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const bioDoc = await getDoc(doc(db, "bio_pages", currentUser.uid));
          if (bioDoc.exists() && bioDoc.data()?.username) {
            setHasProfile(true);
          } else {
            setHasProfile(false);
          }
        } catch {
          setHasProfile(false);
        }
      } else {
        setHasProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const href = user ? "/dashboard" : "/login?redirect=%2Fdashboard";
  const buttonText = hasProfile ? "Open Bio Studio" : "Claim Your Handle";

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-cyan-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)] card-spotlight"
      aria-label="Bio Studio — Create your personal page, organize all your important links, and share one link everywhere."
    >
      {/* Accent gradient glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-500">
            <Link2 className="w-6 h-6" />
          </div>
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
          Bio Link
        </h3>
        <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
          Create your personal link-in-bio page, organize all your important links, and share one custom handle everywhere.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
        {buttonText}
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}
