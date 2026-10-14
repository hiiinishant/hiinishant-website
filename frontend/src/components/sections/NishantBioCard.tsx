"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface NishantBioData {
  username: string;
  url: string;
  title: string;
  description: string;
  buttonText: string;
}

const DEFAULT_BIO_DATA: NishantBioData = {
  username: "nishant",
  url: "/nishant",
  title: "Nishant's Bio Link",
  description: "Explore Nishant's curated digital identity, verified projects, and quick links all in one place.",
  buttonText: "Visit Nishant's Bio",
};

export default function NishantBioCard() {
  const [data, setData] = useState<NishantBioData>(DEFAULT_BIO_DATA);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      // 1. Try backend API
      try {
        const res = await fetch(`${API_BASE}/api/bio/featured`);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json?.url) {
            setData({
              username: json.username || DEFAULT_BIO_DATA.username,
              url: json.url || DEFAULT_BIO_DATA.url,
              title: json.title || DEFAULT_BIO_DATA.title,
              description: json.description || DEFAULT_BIO_DATA.description,
              buttonText: json.buttonText || DEFAULT_BIO_DATA.buttonText,
            });
            return;
          }
        }
      } catch {
        // fall through to Firestore check
      }

      // 2. Direct Firestore fallback if backend is sleeping or unreachable
      if (db) {
        try {
          const snap = await getDoc(doc(db, "bioSettings", "nishant"));
          if (mounted && snap.exists()) {
            const fsData = snap.data();
            setData({
              username: fsData?.username || DEFAULT_BIO_DATA.username,
              url: fsData?.url || (fsData?.username ? `/${fsData.username}` : DEFAULT_BIO_DATA.url),
              title: fsData?.title || DEFAULT_BIO_DATA.title,
              description: fsData?.description || DEFAULT_BIO_DATA.description,
              buttonText: fsData?.buttonText || DEFAULT_BIO_DATA.buttonText,
            });
          }
        } catch {
          // keep default
        }
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link
      href={data.url}
      className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-cyan-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)] card-spotlight"
      aria-label={`${data.title} — ${data.description}`}
    >
      {/* Card accent gradient glow */}
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
          {data.title}
        </h3>
        <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
          {data.description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
        {data.buttonText}
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}
