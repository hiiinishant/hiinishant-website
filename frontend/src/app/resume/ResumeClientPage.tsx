"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { API_BASE } from "@/lib/api";

export default function ResumeClientPage() {
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [latestResume, setLatestResume] = useState<any>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch latest resume from backend → Firestore
  useEffect(() => {
    async function fetchResume() {
      try {
        const backendUrl = API_BASE || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/resume`);
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

  // resumeUrl is the Cloudinary secure_url or fallback
  const resumeUrl: string = latestResume?.resumeUrl || latestResume?.fileUrl || "/resume.pdf";
  const resumeTitle: string = latestResume?.title || "Nishant Kumar — Resume";

  // Force file download directly instead of opening in a new tab
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      let targetUrl = resumeUrl;
      if (targetUrl.includes("res.cloudinary.com") && !targetUrl.includes("fl_attachment")) {
        targetUrl = targetUrl.replace("/upload/", "/upload/fl_attachment/");
      }

      const filename = latestResume?.title
        ? `${latestResume.title.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`
        : "Nishant_Kumar_Resume.pdf";

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 250);
    } catch (err) {
      console.warn("[Resume Download] Fallback download triggered:", err);
      let fallbackUrl = resumeUrl;
      if (fallbackUrl.includes("res.cloudinary.com") && !fallbackUrl.includes("fl_attachment")) {
        fallbackUrl = fallbackUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      const a = document.createElement("a");
      a.href = fallbackUrl;
      a.download = "Nishant_Kumar_Resume.pdf";
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 250);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative noise overflow-x-clip">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[300px] rounded-full bg-accent/5 blur-[100px] sm:blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[280px] sm:w-[500px] h-[200px] sm:h-[250px] rounded-full bg-blue-500/5 blur-[90px] sm:blur-[120px] pointer-events-none -z-10" />

      <PageHeader
        label="Resume Vault"
        title={
          <>
            Official <span className="text-gradient">Credentials</span>
          </>
        }
        description="View and download Nishant Kumar's official curriculum vitae."
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── LEFT / MOBILE PRIMARY: Metadata & Single Download Action ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5 sm:space-y-6 animate-slide-in-left self-start">

            {/* Profile card */}
            <div className="rounded-3xl glass border border-white/5 p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50 pointer-events-none" />
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-white/10 bg-brand-900 shadow-md flex-shrink-0">
                  <img
                    src="/profile.jpg"
                    alt="Nishant Kumar"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                    Nishant Kumar
                  </h3>
                  <p className="text-xs text-accent font-medium truncate">Founder · 2 AM Study</p>
                </div>
              </div>
              <p className="text-xs text-brand-300 mt-3.5 sm:mt-4 leading-relaxed">
                B.E. Computer Science graduate creating high-value education
                platforms, structured GATE CSE study portals, and sharing the
                journey of building startups in public.
              </p>
            </div>

            {/* Document details card */}
            <div className="rounded-3xl glass border border-white/5 p-5 sm:p-6 shadow-xl space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h4 className="text-[11px] sm:text-xs font-bold text-brand-200 uppercase tracking-widest">
                  Document Details
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] text-emerald-400 font-bold tracking-wider uppercase border border-emerald-500/25 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="min-w-0">
                  <p className="text-brand-400 text-[11px]">Document</p>
                  <p className="text-brand-200 font-medium font-mono truncate" title={resumeTitle}>
                    {latestResume?.title || "Nishant Kumar CV"}
                  </p>
                </div>
                <div>
                  <p className="text-brand-400 text-[11px]">Format</p>
                  <p className="text-brand-200 font-medium font-mono">PDF</p>
                </div>
                <div>
                  <p className="text-brand-400 text-[11px]">Security</p>
                  <p className="text-brand-200 font-medium">Digital Signature</p>
                </div>
                <div>
                  <p className="text-brand-400 text-[11px]">Updated</p>
                  <p className="text-brand-200 font-medium truncate">
                    {latestResume?.uploadedAt
                      ? new Date(latestResume.uploadedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Latest Build"}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Document Preview Banner (Shown only on small screens) */}
            <div className="block lg:hidden rounded-3xl glass border border-white/5 p-5 shadow-xl relative overflow-hidden bg-brand-950/40 text-center">
              <div className="relative w-20 h-24 mx-auto rounded-xl border border-white/10 glass bg-gradient-to-b from-white/5 to-white/0 shadow-lg flex flex-col justify-between p-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-400 font-bold text-[10px] font-mono bg-red-500/10 px-1 rounded border border-red-500/20">PDF</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="w-10 h-1 bg-brand-300/50 rounded" />
                  <div className="w-12 h-0.5 bg-brand-400/30 rounded" />
                  <div className="w-8 h-0.5 bg-brand-400/30 rounded" />
                </div>
                <span className="text-[8px] text-brand-400 uppercase font-mono">Verified CV</span>
              </div>
              <p className="text-xs text-brand-300 font-medium">
                Official Curriculum Vitae is ready for instant download.
              </p>
            </div>

            {/* ── THE SINGLE DOWNLOAD RESUME BUTTON (Direct File Download) ── */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-4 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-accent/20 active:scale-[0.98] cursor-pointer group disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Downloading…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Resume (PDF)</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ── RIGHT: Desktop PDF Viewer (Interactive on large screens) ── */}
          <div className="hidden lg:block lg:col-span-8 animate-scale-in">
            <div className="flex flex-col rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl">

              {/* Mac-style title bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-brand-950/40 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] opacity-80" />
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-brand-200">
                  <span className="text-accent">📄</span>
                  <span className="font-mono truncate max-w-[300px]">{resumeTitle}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400 font-bold tracking-widest uppercase border border-emerald-500/25">
                    ✓ Verified
                  </span>
                </div>

                {/* Right corner: Open in Tab */}
                <div className="flex items-center gap-2">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-brand-200 hover:text-white text-[11px] font-semibold tracking-wide transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Tab
                  </a>
                </div>
              </div>

              {/* Viewer area */}
              <div className="relative w-full h-[70vh] min-h-[520px] max-h-[700px] bg-brand-950/20">

                {/* Loading spinner */}
                {(isFetchingData || isIframeLoading) && (
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

                {/* The iframe */}
                <iframe
                  ref={iframeRef}
                  src={resumeUrl}
                  className="w-full h-full border-none bg-white"
                  title={resumeTitle}
                  onLoad={() => setIsIframeLoading(false)}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}



