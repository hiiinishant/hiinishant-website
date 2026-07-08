"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";

export default function ResumeClientPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [latestResume, setLatestResume] = useState<any>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Fetch latest resume from backend → Firestore
  useEffect(() => {
    async function fetchResume() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/resume`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLatestResume(data[0]);
        }
      } catch (err: any) {
        console.error("[Resume] fetch error:", err);
        setResumeError(err.message);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchResume();
  }, []);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage("Resume link copied!");
    }
  };

  // resumeUrl is the Cloudinary secure_url stored in Firestore.
  // It already has fl_attachment:false injected at upload time,
  // so it renders inline in an iframe with no further manipulation.
  const resumeUrl: string = latestResume?.resumeUrl || latestResume?.fileUrl || "";
  const resumeTitle: string = latestResume?.title || "Nishant Kumar — Resume";

  const hasResume = !!resumeUrl;

  return (
    <div className="min-h-screen pb-20 relative noise">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-accent/3 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[250px] rounded-full bg-blue-500/3 blur-[120px] pointer-events-none -z-10" />

      <PageHeader
        label="Resume Vault"
        title={
          <>
            Official <span className="text-gradient">Credentials</span>
          </>
        }
        description="View, download, and share my professional curriculum vitae."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: Metadata & Actions ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 animate-slide-in-left self-start">

            {/* Profile card */}
            <div className="rounded-3xl glass border border-white/5 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/2 to-transparent opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-brand-900 shadow-md">
                  <img
                    src="/profile.jpg"
                    alt="Nishant Kumar"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Nishant Kumar
                  </h3>
                  <p className="text-xs text-accent font-medium">Founder · 2 AM Study</p>
                </div>
              </div>
              <p className="text-xs text-brand-300 mt-4 leading-relaxed">
                B.E. Computer Science graduate creating high-value education
                platforms, structured GATE CSE study portals, and sharing the
                build process.
              </p>
            </div>

            {/* Document details */}
            <div className="rounded-3xl glass border border-white/5 p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-brand-200 uppercase tracking-widest border-b border-white/5 pb-2">
                Document Details
              </h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <p className="text-brand-400">File Name</p>
                  <p className="text-brand-200 font-medium font-mono truncate">
                    {latestResume?.title || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-brand-400">Format</p>
                  <p className="text-brand-200 font-medium">PDF</p>
                </div>
                <div>
                  <p className="text-brand-400">Status</p>
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {hasResume ? "Verified" : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-brand-400">Updated</p>
                  <p className="text-brand-200 font-medium">
                    {latestResume?.uploadedAt
                      ? new Date(latestResume.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {hasResume && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </a>
              )}
              <button
                onClick={handleShare}
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.316-2.158m0 0a3 3 0 10-5.367-2.684 3 3 0 005.368 2.684zm0 9.316l-4.316-2.158m0 0a3 3 0 10-5.367 2.684 3 3 0 005.368-2.684z" />
                </svg>
                Share Vault URL
              </button>
            </div>
          </div>

          {/* ── RIGHT: PDF Viewer ── */}
          <div className="lg:col-span-8 animate-scale-in">

            {/* Desktop viewer (hidden on mobile) */}
            <div className="hidden md:flex flex-col rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl">

              {/* Mac-style title bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-brand-950/40 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] opacity-80" />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-semibold text-brand-200">
                  <span className="text-accent">📄</span>
                  <span className="font-mono truncate max-w-[220px]">{resumeTitle}</span>
                  {hasResume && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400 font-bold tracking-widest uppercase border border-emerald-500/25">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-brand-200 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.316-2.158m0 0a3 3 0 10-5.367-2.684 3 3 0 005.368 2.684zm0 9.316l-4.316-2.158m0 0a3 3 0 10-5.367 2.684 3 3 0 005.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  {hasResume && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-1.5 px-3 rounded-lg bg-accent text-black hover:bg-accent-hover text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-md shadow-accent/20"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
              </div>

              {/* Viewer area */}
              <div className="relative w-full h-[78vh] min-h-[560px] bg-brand-950/20">

                {/* Loading spinner */}
                {(isFetchingData || (isIframeLoading && hasResume)) && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-brand-950/80 backdrop-blur-md">
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
                      <div className="absolute inset-2 rounded-full bg-brand-950 flex items-center justify-center text-accent font-bold text-[10px]">
                        PDF
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-brand-300 tracking-wider uppercase">
                      Loading Resume…
                    </p>
                    <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-accent animate-shimmer w-full" style={{ backgroundSize: "200% 100%" }} />
                    </div>
                  </div>
                )}

                {/* ── The iframe — src is the Cloudinary resumeUrl directly ── */}
                {!isFetchingData && hasResume && (
                  <iframe
                    ref={iframeRef}
                    src={resumeUrl}
                    className="w-full h-full border-none bg-white"
                    title={resumeTitle}
                    onLoad={() => setIsIframeLoading(false)}
                  />
                )}

                {/* No resume uploaded yet */}
                {!isFetchingData && !hasResume && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                    <svg className="w-14 h-14 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-brand-400 text-sm font-medium">
                      {resumeError ? "Failed to load resume. Please try again later." : "No resume uploaded yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile fallback */}
            <div className="md:hidden rounded-3xl glass border border-white/5 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-scan pointer-events-none" />

              <div className="text-center space-y-6 py-6">
                {/* Document icon */}
                <div className="relative w-28 h-36 mx-auto rounded-xl border border-white/10 glass bg-gradient-to-b from-white/5 to-white/0 shadow-2xl flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-red-400 font-bold text-xs font-mono bg-red-500/10 px-1 rounded border border-red-500/20">pdf</span>
                    {hasResume && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-12 h-1 bg-brand-300/60 rounded" />
                    <div className="w-16 h-0.5 bg-brand-400/40 rounded" />
                    <div className="w-10 h-0.5 bg-brand-400/40 rounded" />
                    <div className="w-14 h-0.5 bg-brand-400/40 rounded" />
                  </div>
                  <div className="text-[8px] text-brand-400 flex justify-between">
                    <span>PDF</span>
                    <span>{hasResume ? "Verified" : "—"}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">{resumeTitle}</h3>
                  <p className="text-xs text-brand-400 mt-2 leading-relaxed">
                    Open or download my verified CV using the links below.
                  </p>
                </div>

                <div className="space-y-2.5 max-w-xs mx-auto">
                  {hasResume ? (
                    <>
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </a>
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open PDF
                      </a>
                    </>
                  ) : (
                    <p className="text-brand-500 text-xs py-4">No resume available yet.</p>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.316-2.158m0 0a3 3 0 10-5.367-2.684 3 3 0 005.368 2.684zm0 9.316l-4.316-2.158m0 0a3 3 0 10-5.367 2.684 3 3 0 005.368-2.684z" />
                    </svg>
                    Share Vault URL
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="px-5 py-3.5 rounded-2xl glass-strong border border-accent/30 bg-brand-950/90 text-accent font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
