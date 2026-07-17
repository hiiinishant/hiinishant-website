import { useState, useEffect, useRef, useCallback } from "react";
import { UserProfile } from "./NsgramAuthProvider";

export type CallState = "idle" | "calling" | "incoming" | "in-call";
export type CallType = "voice" | "video";

export type IncomingCallInfo = {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  conversationId: string;
  callType: CallType;
};

// Detect iOS/iPadOS devices (needed for constraint fallback priority)
function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Robust helper to acquire media stream with safe fallbacks and HTTPS/secure context diagnostics.
async function acquireMediaStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof window !== "undefined" && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
    throw { name: "SecurityError", message: "Secure context (HTTPS) required" };
  }

  // On iOS, use simpler video constraints — requesting exact width/height causes NotAllowedError
  // even when the user has granted permission, because the hardware can't satisfy the constraints.
  if (isIOSDevice() && constraints.video && typeof constraints.video === "object") {
    constraints = {
      audio: constraints.audio,
      video: { facingMode: (constraints.video as MediaTrackConstraints).facingMode ?? "user" },
    };
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err: any) {
    // OverconstrainedError / ConstraintNotSatisfied → relax video constraints progressively
    if ((err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") && constraints.video) {
      console.warn("[acquireMedia] Overconstrained. Retrying with facingMode only...");
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user" } });
      } catch {
        console.warn("[acquireMedia] Still failing. Trying video=true...");
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch {
          // Final fallback: audio-only if video keeps failing
          if (!constraints.audio) throw err;
          console.warn("[acquireMedia] Video failed entirely. Falling back to audio-only.");
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
      }
    }

    // NotFoundError: device not found. If we wanted video but it's not present, try audio-only
    if (err.name === "NotFoundError" && constraints.video) {
      console.warn("[acquireMedia] No camera found. Falling back to audio-only.");
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }

    throw err;
  }
}

export function useVoiceCall(
  socket: any,
  profile: UserProfile | null,
  selectedChatUser: UserProfile | null,
  selectedConversationId: string | null
) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCallInfo, setIncomingCallInfo] = useState<IncomingCallInfo | null>(null);
  const [callErrorMessage, setCallErrorMessage] = useState<string | null>(null);

  // Expose local and remote stream objects for rendering in <video> elements
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePartnerIdRef = useRef<string | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringAudioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tracking call status & duration to save call log like Instagram
  const isCallerRef = useRef(false);
  const durationRef = useRef(0);

  // ── Ring tone helpers (Web Audio API — no external file needed) ─────────────
  const stopRinging = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringAudioCtxRef.current) {
      ringAudioCtxRef.current.close().catch(() => { });
      ringAudioCtxRef.current = null;
    }
  }, []);

  const startRinging = useCallback((type: "incoming" | "outgoing") => {
    // Stop any previous ring first
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringAudioCtxRef.current) {
      ringAudioCtxRef.current.close().catch(() => { });
      ringAudioCtxRef.current = null;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringAudioCtxRef.current = ctx;

      const playBeep = (freq: number, duration: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      const playRingCycle = () => {
        if (type === "incoming") {
          // Classic phone double-ring: beep-beep ... pause
          playBeep(880, 0.4, 0);
          playBeep(880, 0.4, 0.5);
        } else {
          // Outgoing dial tone: single lower tone
          playBeep(480, 0.6, 0);
        }
      };

      // Mobile browsers (iOS Safari, Chrome Android) start AudioContext in
      // "suspended" state — must call resume() before scheduling any audio nodes.
      // Without this, incoming ring tones are completely silent on phones.
      const start = () => {
        playRingCycle();
        ringIntervalRef.current = setInterval(playRingCycle, 2000);
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(start).catch(start); // fallback even if resume rejects
      } else {
        start();
      }
    } catch {
      // AudioContext not supported — silently skip
    }
  }, []);


  // Clean up WebRTC peer connection and streams
  const cleanupCall = useCallback(() => {
    stopRinging();
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    activePartnerIdRef.current = null;
    setCallState("idle");
    setCallDuration(0);
    setIncomingCallInfo(null);
    setIsMuted(false);
    setIsCameraOn(false);
    setCallType("voice");

    // Reset tracking refs
    durationRef.current = 0;
    isCallerRef.current = false;
  }, []);

  // End Call handler
  const endCall = useCallback(() => {
    if (activePartnerIdRef.current && socket) {
      socket.emit("call-ended", { targetId: activePartnerIdRef.current });

      // Only the caller writes the call log to prevent duplicates
      if (isCallerRef.current && selectedConversationId && selectedChatUser && profile) {
        const status = callState === "in-call" ? "completed" : "missed";
        socket.emit("save-call-log", {
          conversationId: selectedConversationId,
          callerId: profile.id,
          calleeId: selectedChatUser.id,
          callType,
          status,
          duration: durationRef.current,
        });
      }
    }
    cleanupCall();
  }, [cleanupCall, socket, selectedConversationId, selectedChatUser, profile, callState, callType, stopRinging]);

  // Decline Call handler
  const declineCall = useCallback(() => {
    if (incomingCallInfo && socket) {
      socket.emit("call-declined", { callerId: incomingCallInfo.callerId, reason: "declined" });
    }
    cleanupCall();
  }, [incomingCallInfo, socket, cleanupCall, stopRinging]);

  // Play remote stream audio (always useful as fallback/audio routing)
  const playRemoteAudio = (stream: MediaStream) => {
    if (!audioRef.current) {
      const audio = new Audio();
      // playsInline is critical on iOS: without it, Safari routes audio to the
      // earpiece instead of the speaker during calls.
      (audio as any).playsInline = true;
      audio.srcObject = stream;
      audio.autoplay = true;
      audioRef.current = audio;
    } else {
      audioRef.current.srcObject = stream;
    }
    audioRef.current.play().catch((err) => {
      console.error("Failed to play remote audio:", err);
    });
  };

  // Setup WebRTC peer connection
  const createPeerConnection = useCallback(
    (targetId: string, stream?: MediaStream | null) => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection({
        iceServers: [
          // Multiple STUN servers for faster ICE gathering fallback
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
        // Pre-gather ICE candidates before the offer/answer exchange
        // so they are ready to send immediately when negotiation starts
        iceCandidatePoolSize: 5,
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && profile) {
          socket.emit("webrtc-ice", {
            senderId: profile.id,
            targetId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
          playRemoteAudio(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connecting") {
          setConnectionStatus("Connecting...");
        } else if (pc.connectionState === "connected") {
          setConnectionStatus("Connected");
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setConnectionStatus("Ended");
          cleanupCall();
        }
      };

      // Add tracks from the provided stream OR fall back to localStreamRef
      const trackSource = stream ?? localStreamRef.current;
      if (trackSource) {
        trackSource.getTracks().forEach((track) => {
          pc.addTrack(track, trackSource);
        });
      }

      pcRef.current = pc;
      return pc;
    },
    [socket, profile, cleanupCall]
  );

  // Accept Call handler
  const acceptCall = useCallback(async () => {
    if (!incomingCallInfo || !socket || !profile) return;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    stopRinging(); // Stop the incoming ring tone when answered

    // Read callType directly from incomingCallInfo to avoid stale React state
    const acceptedCallType = incomingCallInfo.callType;
    setCallType(acceptedCallType);
    setIsCameraOn(acceptedCallType === "video");

    activePartnerIdRef.current = incomingCallInfo.callerId;
    setCallState("in-call");
    setConnectionStatus("Connecting...");

    // Signal acceptance IMMEDIATELY before waiting for media — lets caller start offer without delay
    socket.emit("call-accepted", {
      callerId: incomingCallInfo.callerId,
      calleeId: profile.id,
    });

    try {
      // Use simpler video constraints — iOS Safari rejects ideal width/height with NotAllowedError
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: acceptedCallType === "video" ? { facingMode: "user" } : false,
      };
      const stream = await acquireMediaStream(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create WebRTC peer connection — pass stream explicitly to ensure tracks are added
      createPeerConnection(incomingCallInfo.callerId, stream);

      // Start call duration timer
      setCallDuration(0);
      durationRef.current = 0;
      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error("[acceptCall] Media access error:", err.name, err.message, err);

      let message = "Unable to access microphone.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = isIOSDevice()
          ? "Microphone access denied. Go to Settings → Safari → Microphone and allow access."
          : "Microphone access denied. Please allow it in your browser settings and try again.";
      } else if (err.name === "NotFoundError") {
        message = "No microphone found on this device.";
      } else if (err.name === "NotReadableError") {
        message = "Microphone is in use by another app. Close it and try again.";
      } else if (err.name === "OverconstrainedError") {
        message = "Your device camera doesn't support the required settings.";
      } else if (err.name === "SecurityError") {
        message = "Microphone access requires HTTPS. Please use a secure connection.";
      }

      setCallErrorMessage(message);
      // Notify caller that we couldn't answer due to media issues
      if (incomingCallInfo && socket) {
        socket.emit("call-declined", { callerId: incomingCallInfo.callerId, reason: "mic_error" });
      }
      cleanupCall();
    }
  }, [incomingCallInfo, socket, profile, createPeerConnection, cleanupCall, stopRinging]);

  // Initiate call to selectedChatUser
  const initiateCall = useCallback(async (type: CallType) => {
    if (!selectedChatUser || !socket || !profile || !selectedConversationId) return;
    setCallErrorMessage(null);
    setCallType(type);
    setCallState("calling");
    setIsCameraOn(type === "video");
    setConnectionStatus("Calling...");
    activePartnerIdRef.current = selectedChatUser.id;
    isCallerRef.current = true; // Mark as caller
    durationRef.current = 0;

    // Start outgoing ring sound immediately for User A (caller feedback)
    startRinging("outgoing");

    try {
      // Use simpler video constraints — iOS Safari rejects ideal width/height with NotAllowedError
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === "video" ? { facingMode: "user" } : false,
      };

      // Get media FIRST so tracks are ready before we create the peer connection on call-accepted
      const stream = await acquireMediaStream(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Emit call signal AFTER media so localStreamRef is populated when offer is made
      socket.emit("call-user", {
        callerId: profile.id,
        calleeId: selectedChatUser.id,
        callerName: profile.displayName,
        callerAvatar: profile.avatar,
        conversationId: selectedConversationId,
        callType: type,
      });

      setConnectionStatus("Ringing...");

      // Set timeout for no-answer (30 seconds)
      callTimeoutRef.current = setTimeout(() => {
        setCallErrorMessage("No answer from user.");
        endCall();
      }, 30000);
    } catch (err: any) {
      console.error("[initiateCall] Media access error:", err.name, err.message, err);

      let message = "Unable to access microphone.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = isIOSDevice()
          ? "Microphone access denied. Go to Settings → Safari → Microphone and allow access."
          : "Microphone access denied. Please allow it in your browser settings and try again.";
      } else if (err.name === "NotFoundError") {
        message = "No microphone found on this device.";
      } else if (err.name === "NotReadableError") {
        message = "Microphone is in use by another app. Close it and try again.";
      } else if (err.name === "OverconstrainedError") {
        message = "Your device camera doesn't support the required settings.";
      } else if (err.name === "SecurityError") {
        message = "Microphone access requires HTTPS. Please use a secure connection.";
      }

      setCallErrorMessage(message);
      cleanupCall();
    }
  }, [selectedChatUser, socket, profile, selectedConversationId, endCall, cleanupCall, startRinging]);

  // Toggle audio track enable/disable (Mute)
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle camera track enable/disable (Video Toggle)
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn((prev) => !prev);
    }
  }, []);

  // Listen to incoming sockets for call signaling
  useEffect(() => {
    if (!socket || !profile) return;

    // 1. Incoming Call
    const onIncomingCall = (data: IncomingCallInfo) => {
      if (callState !== "idle") {
        // We are busy
        socket.emit("call-declined", { callerId: data.callerId, reason: "busy" });
        return;
      }
      isCallerRef.current = false; // We are callee
      durationRef.current = 0;
      setIncomingCallInfo(data);
      setCallType(data.callType);
      setIsCameraOn(data.callType === "video");
      setCallState("incoming");

      // 🔔 Start ringing for User B
      startRinging("incoming");

      // Auto-decline if callee doesn't answer in 30 seconds
      callTimeoutRef.current = setTimeout(() => {
        socket.emit("call-declined", { callerId: data.callerId, reason: "timeout" });
        cleanupCall(); // also calls stopRinging
      }, 30000);
    };

    // 2. Call Accepted — Caller (User A) creates PeerConnection and sends offer
    const onCallAccepted = async (data: { calleeId: string }) => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      stopRinging(); // User A: stop outgoing ring tone when answered
      setCallState("in-call");
      setConnectionStatus("Connecting...");

      // Caller creates PeerConnection — pass localStreamRef so video tracks are added
      const pc = createPeerConnection(data.calleeId, localStreamRef.current);

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true, // Always request video capability in the SDP
        });
        await pc.setLocalDescription(offer);
        console.log("Created offer, sending to", data.calleeId);
        socket.emit("webrtc-offer", {
          senderId: profile.id,
          targetId: data.calleeId,
          offer,
        });

        // Start call duration timer
        setCallDuration(0);
        durationRef.current = 0;
        callDurationIntervalRef.current = setInterval(() => {
          setCallDuration((prev) => {
            const next = prev + 1;
            durationRef.current = next;
            return next;
          });
        }, 1000);
      } catch (err) {
        console.error("Failed to create offer:", err);
        cleanupCall();
      }
    };

    // 3. Call Declined
    const onCallDeclined = (data: { reason?: string }) => {
      console.log("Call declined, reason:", data.reason);
      if (data.reason === "busy") {
        setCallErrorMessage("User is busy.");
      } else if (data.reason === "offline") {
        setCallErrorMessage("User is offline.");
      } else if (data.reason === "mic_error") {
        setCallErrorMessage("User has media access issues.");
      } else if (data.reason === "timeout") {
        setCallErrorMessage("Call timed out.");
      } else {
        setCallErrorMessage("Call declined.");
      }

      // Save call log as caller when remote partner declines
      if (isCallerRef.current && selectedConversationId && selectedChatUser && profile) {
        const status = data.reason === "timeout" ? "missed" : "declined";
        socket.emit("save-call-log", {
          conversationId: selectedConversationId,
          callerId: profile.id,
          calleeId: selectedChatUser.id,
          callType,
          status,
          duration: 0,
        });
      }

      cleanupCall();
    };

    // 4. Call Ended
    const onCallEnded = () => {
      console.log("Call ended by remote partner");

      // Save call log as caller when call session ends
      if (isCallerRef.current && selectedConversationId && selectedChatUser && profile) {
        socket.emit("save-call-log", {
          conversationId: selectedConversationId,
          callerId: profile.id,
          calleeId: selectedChatUser.id,
          callType,
          status: "completed",
          duration: durationRef.current,
        });
      }

      cleanupCall();
    };

    // 5. WebRTC Offer
    const onWebRtcOffer = async (data: { offer: any; senderId: string }) => {
      console.log("Received WebRTC offer from", data.senderId);
      const pc = createPeerConnection(data.senderId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Created answer, sending to", data.senderId);
        socket.emit("webrtc-answer", {
          senderId: profile.id,
          targetId: data.senderId,
          answer,
        });
      } catch (err) {
        console.error("Failed to answer WebRTC offer:", err);
        cleanupCall();
      }
    };

    // 6. WebRTC Answer
    const onWebRtcAnswer = async (data: { answer: any; senderId: string }) => {
      console.log("Received WebRTC answer from", data.senderId);
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error("Failed to set remote description:", err);
          cleanupCall();
        }
      }
    };

    // 7. WebRTC ICE Candidate
    const onWebRtcIce = async (data: { candidate: any; senderId: string }) => {
      console.log("Received WebRTC ICE candidate from", data.senderId);
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      }
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("call-declined", onCallDeclined);
    socket.on("call-ended", onCallEnded);
    socket.on("webrtc-offer", onWebRtcOffer);
    socket.on("webrtc-answer", onWebRtcAnswer);
    socket.on("webrtc-ice", onWebRtcIce);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("call-declined", onCallDeclined);
      socket.off("call-ended", onCallEnded);
      socket.off("webrtc-offer", onWebRtcOffer);
      socket.off("webrtc-answer", onWebRtcAnswer);
      socket.off("webrtc-ice", onWebRtcIce);
    };
  }, [socket, profile, callState, callType, createPeerConnection, cleanupCall, startRinging, stopRinging]);

  // Handle errors showing up for a few seconds then clearing
  useEffect(() => {
    if (callErrorMessage) {
      const timer = setTimeout(() => {
        setCallErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [callErrorMessage]);

  // Always clean up on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callState,
    callType,
    connectionStatus,
    isMuted,
    isCameraOn,
    callDuration,
    incomingCallInfo,
    callErrorMessage,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
