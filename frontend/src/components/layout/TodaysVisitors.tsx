"use client";

import { useEffect, useRef, useState } from "react";
import { io as socketIO, Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const STORAGE_KEY = "visitor_pinged_date";

interface VisitorData {
  count: number;
  asOf: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TodaysVisitors() {
  const [data, setData] = useState<VisitorData | null>(null);
  const [error, setError] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    // ── Ping backend once per day per device ──────────────────────────────
    const ping = async () => {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const lastPinged = localStorage.getItem(STORAGE_KEY);

      try {
        let endpoint = `${API_BASE}/api/visitors`;
        let method: "GET" | "POST" = "GET";

        // Only POST on the first visit of the day
        if (lastPinged !== today) {
          method = "POST";
          endpoint = `${API_BASE}/api/visitors/ping`;
        }

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) throw new Error("Non-ok response");

        const json: VisitorData = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
          if (method === "POST") {
            localStorage.setItem(STORAGE_KEY, today);
          }
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    ping();

    // ── Socket.IO real-time updates ───────────────────────────────────────
    try {
      const socket = socketIO(API_BASE, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 3,
      });
      socketRef.current = socket;

      socket.on("visitor-update", (payload: VisitorData) => {
        if (!cancelled) {
          setData(payload);
          setError(false);
        }
      });

      socket.on("connect_error", () => {
        // Socket error — non-fatal, we already have polled data (or will show error)
      });
    } catch {
      // Socket init failed — gracefully ignore
    }

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, []);

  // ── Graceful fallback ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-[11px] text-brand-600 text-center">
          📊 Visitor data unavailable
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <div className="h-3 w-32 rounded bg-white/8 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Live widget ───────────────────────────────────────────────────────────
  return (
    <div className="mt-6 pt-4 border-t border-white/5">
      <p className="text-[11px] font-bold text-brand-300 uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-4 h-px bg-accent/60 inline-block" />
        Today&apos;s Visitors
      </p>
      <p className="text-[13px] text-brand-400 leading-snug">
        <span className="text-white font-semibold">👥 {data.count.toLocaleString()}</span>
        {" "}visitors today
      </p>
      <p className="text-[11px] text-brand-600 mt-0.5">
        🕒 As of {formatTime(data.asOf)}
      </p>
    </div>
  );
}
