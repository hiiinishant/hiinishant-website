import React, { useEffect, useRef } from "react";
import { IncomingCallInfo, CallType } from "./useVoiceCall";
import { PhoneOff, PhoneCall } from "lucide-react";

// Format call duration to mm:ss
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Self-contained Video Element binding helper
interface VideoRendererProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export function VideoRenderer({ stream, muted = false, className = "" }: VideoRendererProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={{ transform: muted ? "scaleX(-1)" : "none" }} // Mirror local camera view
    />
  );
}

interface IncomingCallModalProps {
  info: IncomingCallInfo | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ info, onAccept, onDecline }: IncomingCallModalProps) {
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl">
        {/* Animated pulse rings behind avatar */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
          <div className="absolute -inset-2 animate-pulse rounded-full bg-amber-400/10" />
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-400/30 bg-slate-950 text-4xl select-none shadow-lg">
            {info.callerAvatar === "girl" ? "👧" : "👦"}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {info.callType === "video" ? "Incoming Video Call 🎥" : "Incoming Voice Call 📞"}
        </h3>
        <p className="text-sm font-semibold text-amber-300 mb-6">@{info.callerName}</p>

        {/* Buttons container */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onDecline}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 hover:bg-rose-600 text-white transition duration-200 shadow-md hover:scale-105"
            title="Decline call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            onClick={onAccept}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition duration-200 shadow-md hover:scale-105"
            title="Accept call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActiveCallOverlayProps {
  callState: "calling" | "in-call";
  callType: CallType;
  connectionStatus: string;
  isMuted: boolean;
  isCameraOn: boolean;
  duration: number;
  partnerName: string;
  partnerAvatar: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export function ActiveCallOverlay({
  callState,
  callType,
  connectionStatus,
  isMuted,
  isCameraOn,
  duration,
  partnerName,
  partnerAvatar,
  localStream,
  remoteStream,
  onEndCall,
  onToggleMute,
  onToggleCamera,
}: ActiveCallOverlayProps) {
  const isVideoCall = callType === "video";
  const showRemoteVideo = isVideoCall && callState === "in-call" && remoteStream;
  const showLocalVideo = isVideoCall && localStream && isCameraOn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4">
      <div className="relative w-full max-w-sm h-[600px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col justify-between p-6">

        {/* Full-screen Remote Video for Video calls */}
        {showRemoteVideo ? (
          <div className="absolute inset-0 bg-slate-950 z-0">
            <VideoRenderer stream={remoteStream} className="w-full h-full object-cover" />
          </div>
        ) : (
          /* fallback to Avatar if Voice call or Camera Off */
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center">
            <div className="relative mb-4 flex h-28 w-28 items-center justify-center">
              {callState === "calling" && (
                <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/20" />
              )}
              {callState === "in-call" && (
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" style={{ animationDuration: "3s" }} />
              )}
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-slate-950 text-5xl select-none shadow-lg">
                {partnerAvatar === "girl" ? "👧" : "👦"}
              </div>
            </div>
          </div>
        )}

        {/* Floating Local Camera Preview (Picture in Picture) */}
        {showLocalVideo && (
          <div className="absolute bottom-28 right-6 w-24 h-36 rounded-2xl border border-white/15 bg-slate-950 object-cover shadow-xl overflow-hidden z-20">
            <VideoRenderer stream={localStream} muted className="w-full h-full object-cover" />
          </div>
        )}

        {/* Call Info / Status Banner (Overlayed at Top) */}
        <div className="relative z-10 w-full text-center bg-slate-950/40 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
          <h3 className="text-md font-bold text-white mb-0.5 truncate">
            {connectionStatus || (callState === "calling" ? "Calling..." : "Voice Call")}
          </h3>
          <p className="text-xs font-semibold text-amber-300">@{partnerName}</p>

          {callState === "in-call" && (
            <p className="text-sm font-mono font-semibold text-emerald-400 mt-1">{formatTime(duration)}</p>
          )}
          {callState === "calling" && (
            <p className="text-[10px] text-amber-400/80 font-medium tracking-wide animate-pulse mt-1">
              {connectionStatus || "Ringing..."}
            </p>
          )}
        </div>

        {/* Control Buttons (Overlayed at Bottom) */}
        <div className="relative z-10 flex justify-center gap-4 mt-auto">
          {/* Mute Mic */}
          <button
            onClick={onToggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-200 shadow-md bg-slate-900/80 backdrop-blur-sm ${isMuted
              ? "border-amber-400/30 text-amber-300 bg-amber-400/10"
              : "border-white/10 text-white hover:bg-white/10"
              }`}
            title={isMuted ? "Unmute mic" : "Mute mic"}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* Toggle Camera (Only on Video Calls) */}
          {isVideoCall && (
            <button
              onClick={onToggleCamera}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-200 shadow-md bg-slate-900/80 backdrop-blur-sm ${!isCameraOn
                ? "border-rose-400/30 text-rose-300 bg-rose-400/10"
                : "border-white/10 text-white hover:bg-white/10"
                }`}
              title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCameraOn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 hover:bg-rose-600 text-white transition duration-200 shadow-md hover:scale-105"
            title="End call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

interface CallErrorBannerProps {
  message: string | null;
}

export function CallErrorBanner({ message }: CallErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 shadow-lg backdrop-blur-md animate-bounce">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {message}
    </div>
  );
}
