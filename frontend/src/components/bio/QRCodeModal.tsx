"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Download, X, QrCode, Copy, Check, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  username: string;
  displayName: string;
  onClose: () => void;
}

const MARGIN = 28; // white padding around QR inside canvas
const QR_SIZE = 260; // pixel size of the QR module area
const CANVAS_SIZE = QR_SIZE + MARGIN * 2;

export default function QRCodeModal({
  username,
  displayName,
  onClose,
}: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://hiiinishant.com/${username}`;

  // Generate the QR code into the canvas
  const generateQR = useCallback(async () => {
    if (!canvasRef.current) return;
    setGenerating(true);
    setError("");
    try {
      const canvas = canvasRef.current;
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      // 1. Fill background with dark card
      ctx.fillStyle = "#0f0f11";
      ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, 24);
      ctx.fill();

      // 2. Render QR to an offscreen canvas
      const offscreen = document.createElement("canvas");
      await QRCode.toCanvas(offscreen, profileUrl, {
        width: QR_SIZE,
        margin: 0,
        color: {
          dark: "#f59e0b",   // amber — matches brand accent
          light: "#0f0f11",  // transparent-like background
        },
        errorCorrectionLevel: "H",
      });

      // 3. Draw QR onto main canvas with margin
      ctx.drawImage(offscreen, MARGIN, MARGIN, QR_SIZE, QR_SIZE);

      setGenerating(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate QR code.");
      setGenerating(false);
    }
  }, [profileUrl]);

  useEffect(() => {
    let active = true;
    const generateOnMount = async () => {
      if (!canvasRef.current) return;
      try {
        const canvas = canvasRef.current;
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable.");

        ctx.fillStyle = "#0f0f11";
        ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, 24);
        ctx.fill();

        const offscreen = document.createElement("canvas");
        await QRCode.toCanvas(offscreen, profileUrl, {
          width: QR_SIZE,
          margin: 0,
          color: {
            dark: "#f59e0b",
            light: "#0f0f11",
          },
          errorCorrectionLevel: "H",
        });

        if (!active) return;
        ctx.drawImage(offscreen, MARGIN, MARGIN, QR_SIZE, QR_SIZE);
        setGenerating(false);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to generate QR code.");
        setGenerating(false);
      }
    };

    generateOnMount();
    return () => {
      active = false;
    };
  }, [profileUrl]);

  // Download as PNG
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `hiiinishant-${username}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [username]);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }, [profileUrl]);

  // Trap focus inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`QR code for ${displayName}'s profile`}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl p-6 flex flex-col items-center gap-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-brand-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close QR code modal"
          autoFocus
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-2">
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            {displayName}
          </h2>
          <p className="text-xs text-brand-400 font-mono mt-0.5">{profileUrl}</p>
        </div>

        {/* Canvas area */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/60">
          {generating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
              <p className="text-xs text-red-400">{error}</p>
              <button
                onClick={generateQR}
                className="px-3 py-1 text-xs rounded-lg bg-accent text-black font-semibold cursor-pointer hover:bg-accent/90 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`rounded-xl transition-opacity duration-300 ${generating ? "opacity-0" : "opacity-100"}`}
            style={{ width: "280px", height: "280px" }}
            aria-label={`QR code for hiiinishant.com/${username}`}
          />
        </div>

        {/* Hint text */}
        {!generating && !error && (
          <p className="text-[11px] text-brand-500 text-center leading-relaxed">
            Scan to open{" "}
            <span className="text-accent font-semibold">hiiinishant.com/{username}</span>
            <br />
            Works with any camera app or QR scanner
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleDownload}
            disabled={generating || !!error}
            className="flex-1 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            aria-label="Download QR code as PNG"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleCopyUrl}
            className="py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Copy profile URL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy URL"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
