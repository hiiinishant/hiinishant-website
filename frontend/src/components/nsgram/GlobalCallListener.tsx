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

  // Play ringtone and vibrate phone
  const startRingtoneAndVibration = () => {
    // 1. Device vibration pattern for mobile phones (0.5s vibrate, 0.25s pause)
    try {
      if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
        navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250]);
      }
    } catch {
      // Ignored if device doesn't support vibration
    }

    // 2. Ringtone audio
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

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
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

  const stopRingtoneAndVibration = () => {
    try {
      if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
        navigator.vibrate(0);
      }
    } catch {}

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
      startRingtoneAndVibration();
    };

    const handleCallEnded = () => {
      stopRingtoneAndVibration();
      setIncomingCall(null);
    };

    const handleCallDeclined = () => {
      stopRingtoneAndVibration();
      setIncomingCall(null);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-declined", handleCallDeclined);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-declined", handleCallDeclined);
      stopRingtoneAndVibration();
    };
  }, [socket, profile, pathname]);

  if (!incomingCall || pathname === "/nsgram/messages") return null;

  const handleDecline = () => {
    if (socket && incomingCall) {
      socket.emit("call-declined", { callerId: incomingCall.callerId, reason: "declined" });
    }
    stopRingtoneAndVibration();
    setIncomingCall(null);
  };

  const handleAccept = () => {
    stopRingtoneAndVibration();
    setIncomingCall(null);
    // Navigate user to messages page with caller conversation
    router.push(`/nsgram/messages?callerId=${incomingCall.callerId}&callType=${incomingCall.callType}`);
  };

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 z-[99999] max-w-md sm:w-96 mx-auto sm:mx-0 animate-bounce-in">
      <div className="glass-strong border-2 border-amber-400/60 p-4 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] bg-slate-900/98 text-white flex items-center justify-between gap-3 backdrop-blur-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl select-none shadow-inner">
            {incomingCall.callerAvatar === "girl" ? "👧" : "👦"}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-black animate-ping" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">
              @{incomingCall.callerName}
            </p>
            <p className="text-xs text-amber-300 flex items-center gap-1 font-semibold mt-0.5 animate-pulse">
              <span>{incomingCall.callType === "video" ? "🎥 Incoming Video Call" : "📞 Incoming Voice Call"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 transition-all active:scale-95 cursor-pointer"
            title="Decline"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <button
            onClick={handleAccept}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs tracking-wide"
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

