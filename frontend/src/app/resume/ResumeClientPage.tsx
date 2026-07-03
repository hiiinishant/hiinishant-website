"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";

export default function ResumeClientPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-hide toast notifications
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage("Resume link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen pb-20 relative noise">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-accent/3 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[250px] rounded-full bg-blue-500/3 blur-[120px] pointer-events-none -z-10" />

      {/* Page Header */}
      <PageHeader
        label="Resume Vault"
        title={
          <>
            Official <span className="text-gradient">Credentials</span>
          </>
        }
        description="View, download, and share my professional curriculum vitae and academic history in high-fidelity PDF format."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Metadata & Actions */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 animate-slide-in-left self-start">
              
              {/* Profile Card Summary */}
              <div className="rounded-3xl glass border border-white/5 p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/2 to-transparent opacity-50 pointer-events-none" />
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-brand-900 shadow-md">
                    <img
                      src="/profilee.jpg"
                      alt="Nishant Kumar"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Nishant Kumar</h3>
                    <p className="text-xs text-accent font-medium">Founder · 2 AM Study</p>
                  </div>
                </div>
                <p className="text-xs text-brand-300 mt-4 leading-relaxed">
                  B.E. Computer Science graduate creating high-value education platforms, structured GATE CSE study portals, and sharing the build process.
                </p>
              </div>

              {/* Document Statistics */}
              <div className="rounded-3xl glass border border-white/5 p-6 shadow-xl space-y-4">
                <h4 className="text-xs font-bold text-brand-200 uppercase tracking-widest border-b border-white/5 pb-2">
                  Document Details
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  <div>
                    <p className="text-brand-400">File Name</p>
                    <p className="text-brand-200 font-medium font-mono truncate">resume.pdf</p>
                  </div>
                  <div>
                    <p className="text-brand-400">Size</p>
                    <p className="text-brand-200 font-medium">~242 KB</p>
                  </div>
                  <div>
                    <p className="text-brand-400">Format</p>
                    <p className="text-brand-200 font-medium">PDF (A4 Standard)</p>
                  </div>
                  <div>
                    <p className="text-brand-400">Status</p>
                    <p className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* RIGHT COLUMN: The Mac-style PDF Viewer Container */}
          <div className="lg:col-span-8 animate-scale-in">
            
            {/* DESKTOP VIEW: Show iframe wrapped in a beautiful Mock Window frame */}
            <div className="hidden md:flex flex-col rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl relative transition-all duration-300">
              
              {/* Mock OS Header Control Bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 glass bg-brand-950/40 relative z-10">
                {/* Left: Window buttons */}
                <div className="flex items-center gap-2 z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] opacity-80" />
                </div>

                {/* Center: File Title & Verification Badge */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-semibold text-brand-200 z-0">
                  <span className="text-accent text-sm">📄</span>
                  <span className="font-mono">Nishant_Kumar_Resume.pdf</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400 font-bold tracking-widest uppercase border border-emerald-500/25 flex items-center gap-0.5">
                    ✓ Verified
                  </span>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2 z-10">
                  <button
                    onClick={handleShare}
                    className="p-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-brand-200 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    title="Share Link"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.316-2.158m0 0a3 3 0 10-5.367-2.684 3 3 0 005.368 2.684zm0 9.316l-4.316-2.158m0 0a3 3 0 10-5.367 2.684 3 3 0 005.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-3 rounded-lg bg-accent text-black hover:bg-accent-hover text-[10px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
                    title="Open PDF"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open PDF
                  </a>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div className="relative w-full overflow-y-auto overflow-x-hidden bg-brand-950/20 scrollbar-hide h-[75vh] min-h-[550px]">
                {/* Skeleton Loader overlay */}
                {isLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-brand-950/80 backdrop-blur-md">
                    <div className="relative w-16 h-16 mb-4">
                      {/* Spinning glow ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
                      <div className="absolute inset-2 rounded-full bg-brand-950 flex items-center justify-center text-accent font-bold text-[10px]">
                        PDF
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-brand-300 tracking-wider uppercase">
                      Decryption Vault Connection...
                    </p>
                    <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-accent animate-shimmer w-full" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                  </div>
                )}

                {/* PDF rendering iframe */}
                <div 
                  className="h-full transition-all duration-300 ease-in-out py-6"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    margin: "0 auto"
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    src="/resume.pdf"
                    className="w-full h-full border-none rounded-xl shadow-lg bg-white"
                    title="Nishant Kumar Resume PDF"
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              </div>
            </div>

            {/* MOBILE VIEW FALLBACK: Glowing Glass Document Card */}
            <div className="md:hidden rounded-3xl glass border border-white/5 p-6 shadow-2xl relative overflow-hidden group">
              {/* Animated scanning line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-scan z-10 pointer-events-none" />
              
              {/* Background radial highlight */}
              <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

              <div className="text-center space-y-6 relative z-10 py-6">
                {/* Visual Representation of Document */}
                <div className="relative w-28 h-36 mx-auto rounded-xl border border-white/10 glass bg-gradient-to-b from-white/5 to-white/0 shadow-2xl flex flex-col justify-between p-4 group-hover:scale-[1.03] transition-transform duration-500">
                  <div className="flex justify-between items-start">
                    <div className="text-red-500 font-bold text-xs uppercase tracking-widest font-mono bg-red-500/10 px-1 rounded border border-red-500/20">
                      pdf
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  
                  {/* Styled lines resembling document skeleton */}
                  <div className="space-y-2 my-2">
                    <div className="w-12 h-1 bg-brand-300/60 rounded" />
                    <div className="w-16 h-0.5 bg-brand-400/40 rounded" />
                    <div className="w-10 h-0.5 bg-brand-400/40 rounded" />
                    <div className="w-14 h-0.5 bg-brand-400/40 rounded" />
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-brand-400">
                    <span>A4 Size</span>
                    <span>242 KB</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white">Nishant Kumar Resume</h3>
                  <p className="text-xs text-brand-400 max-w-sm mx-auto leading-relaxed">
                    Mobile devices require downloading or opening document links in a dedicated viewer. Access my full verified CV below.
                  </p>
                </div>

                {/* Mobile action grid */}
                <div className="space-y-2.5 max-w-xs mx-auto pt-4">
                  <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open PDF
                  </a>
                  <button
                    onClick={handleShare}
                    className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
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

      {/* Toast Notification Pop-up */}
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
