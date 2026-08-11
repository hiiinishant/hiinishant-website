"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNsgramAuth } from "./NsgramAuthProvider";
import { PhoneCall, PhoneOff } from "lucide-react";

interface IncomingCallPayload {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  conversationId: string;
  callType: "voice" | "video";
}

export default function GlobalCallListener() {
  const { socket, profile } = useNsgramAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);

  const ringAudioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request browser notification permission when mounted
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Play ringtone function
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ringAudioCtxRef.current = ctx;

      const playTone = () => {
        if (!ringAudioCtxRef.current || ringAudioCtxRef.current.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      };

      playTone();
      ringIntervalRef.current = setInterval(playTone, 1500);
    } catch {
      // AudioContext autoplay restrictions handled silently
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringAudioCtxRef.current) {
      ringAudioCtxRef.current.close().catch(() => {});
      ringAudioCtxRef.current = null;
    }
  };

  // Trigger native desktop/browser notification
  const triggerBrowserNotification = (data: IncomingCallPayload) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(`📞 Incoming ${data.callType === "video" ? "Video" : "Voice"} Call`, {
        body: `@${data.callerName} is calling you on NSGram! Click to open.`,
        icon: "/favicon.ico",
        tag: `call-${data.callerId}`,
      });

      notification.onclick = () => {
        window.focus();
        router.push(`/nsgram/messages?callerId=${data.callerId}&callType=${data.callType}`);
      };
    }
  };

  useEffect(() => {
    if (!socket || !profile) return;

    const handleIncomingCall = (data: IncomingCallPayload) => {
      // Trigger native browser notification (displays even if tab is in background)
      triggerBrowserNotification(data);

      // If user is on /nsgram/messages page, page.tsx handles full WebRTC connection UI
      if (pathname === "/nsgram/messages") return;

      setIncomingCall(data);
      startRingtone();
    };

    const handleCallEnded = () => {
      stopRingtone();
      setIncomingCall(null);
    };

    const handleCallDeclined = () => {
      stopRingtone();
      setIncomingCall(null);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-declined", handleCallDeclined);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-declined", handleCallDeclined);
      stopRingtone();
    };
  }, [socket, profile, pathname]);

  if (!incomingCall || pathname === "/nsgram/messages") return null;

  const handleDecline = () => {
    if (socket && incomingCall) {
      socket.emit("call-declined", { callerId: incomingCall.callerId, reason: "declined" });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  const handleAccept = () => {
    stopRingtone();
    setIncomingCall(null);
    // Navigate user to messages page with caller conversation
    router.push(`/nsgram/messages?callerId=${incomingCall.callerId}&callType=${incomingCall.callType}`);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-bounce-in max-w-sm w-[calc(100vw-32px)]">
      <div className="glass-strong border border-amber-400/40 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] bg-slate-900/95 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-2xl select-none">
            {incomingCall.callerAvatar === "girl" ? "👧" : "👦"}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-black animate-ping" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              @{incomingCall.callerName}
            </p>
            <p className="text-[11px] text-amber-300 flex items-center gap-1 font-medium">
              <span>{incomingCall.callType === "video" ? "🎥 Incoming Video Call" : "📞 Incoming Voice Call"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
            title="Decline"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
          <button
            onClick={handleAccept}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md hover:scale-105 cursor-pointer flex items-center gap-1 text-xs"
            title="Answer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
