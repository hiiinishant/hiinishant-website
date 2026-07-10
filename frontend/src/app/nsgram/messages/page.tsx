"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNsgramAuth } from "@/components/nsgram/NsgramAuthProvider";
import { useVoiceCall } from "@/components/nsgram/useVoiceCall";
import { IncomingCallModal, ActiveCallOverlay, CallErrorBanner } from "@/components/nsgram/VoiceCallUI";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: Timestamp | string | null;
  read?: boolean;
  replyTo?: { id: string; text: string; senderId: string; senderName: string };
  reactions?: Record<string, string>; // userId -> emoji
  audioUrl?: string;
};

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp | string | null;
  lastMessageBy?: string;
  lastMessageRead?: boolean;
  createdAt?: Timestamp | string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(value: Timestamp | string | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "string") return new Date(value);
  if ("toDate" in value) return value.toDate();
  return null;
}

function formatRelative(value: Timestamp | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatFull(value: Timestamp | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** "last seen 3m ago", "last seen 2h ago", "last seen yesterday", etc. */
function formatLastSeen(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `last seen ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "last seen yesterday";
  if (days < 7) return `last seen ${days}d ago`;
  return `last seen ${date.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
}

function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const aT = toDate(a.lastMessageAt)?.getTime() ?? 0;
    const bT = toDate(b.lastMessageAt)?.getTime() ?? 0;
    return bT - aT;
  });
}

// ─── Voice Note Player Component ──────────────────────────────────────────────
function VoiceNotePlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1.5 min-w-[200px] select-none text-inherit">
      <button
        onClick={togglePlay}
        type="button"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-950 hover:scale-105 active:scale-95 transition"
      >
        {isPlaying ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleScrub}
          className="w-full accent-slate-950 bg-white/20 h-1 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[8px] opacity-60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty-state illustration ─────────────────────────────────────────────────

function EmptyInbox({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center select-none">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-4xl shadow-inner">
          💬
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl">✨</span>
      </div>
      <h2 className="text-base font-bold text-white mb-1">No messages yet</h2>
      <p className="text-xs text-brand-400 max-w-[200px] leading-relaxed">
        Search for people and start your first direct conversation.
      </p>
      <button
        onClick={onSearch}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-4 py-2 text-xs font-bold text-amber-300 transition-all duration-200 hover:-translate-y-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find People
      </button>
    </div>
  );
}

// ─── Inbox conversation card ──────────────────────────────────────────────────

function ConvoCard({
  convo,
  isActive,
  chatUser,
  isOnline,
  hasUnread,
  onClick,
}: {
  convo: Conversation;
  isActive: boolean;
  chatUser: { displayName: string; username: string; avatar: string } | undefined;
  isOnline: boolean;
  hasUnread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
        isActive
          ? "border-amber-400/30 bg-amber-400/8 shadow-sm"
          : "border-transparent hover:border-white/8 hover:bg-white/5"
      }`}
    >
      {/* Avatar + online ring */}
      <div className="relative shrink-0">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl select-none border transition-all duration-200 ${
            isActive
              ? "border-amber-400/30 bg-amber-400/10"
              : "border-white/10 bg-white/5 group-hover:border-white/20"
          }`}
        >
          {chatUser?.avatar === "girl" ? "👧" : "👦"}
        </div>
        {/* Online indicator dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 transition-colors duration-300 ${
            isOnline ? "bg-green-400" : "bg-brand-600"
          }`}
        />
      </div>

      {/* Text info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm truncate leading-tight ${
            hasUnread ? "font-bold text-white" : "font-semibold text-white"
          }`}>
            {chatUser?.displayName ?? "Unknown"}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {convo.lastMessageAt && (
              <span className="text-[10px] text-brand-500 whitespace-nowrap">
                {formatRelative(convo.lastMessageAt)}
              </span>
            )}
            {/* Unread amber dot — only shown when someone else sent the last unread message */}
            {hasUnread && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400/60%)] shrink-0" />
            )}
          </div>
        </div>
        <p className="text-[10px] text-brand-500 leading-tight mb-0.5">
          @{chatUser?.username ?? "—"}
        </p>
        <p
          className={`text-xs truncate leading-snug ${
            hasUnread
              ? "text-white font-semibold"
              : convo.lastMessage
              ? "text-brand-400"
              : "text-brand-600 italic"
          }`}
        >
          {convo.lastMessage || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NsgramMessagesPage() {
  const { profile, users, socket } = useNsgramAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});
  const [convoLoading, setConvoLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // is the chat partner typing?
  // Track which conversations have unread messages (optimistic, driven by conversation doc fields)
  const [readConvoIds, setReadConvoIds] = useState<Set<string>>(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // debounce for typing-stop
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);

  // ── Sync convoId from URL ──────────────────────────────────────────────────
  useEffect(() => {
    const id = searchParams.get("convoId");
    if (id) setSelectedConversationId(id);
  }, [searchParams]);

  // ── Scroll Lock: Prevent entire page scroll on mobile to avoid keyboard shifts ──
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.height = "100%";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.height = originalBodyHeight;
    };
  }, []);

  const handleInputFocus = useCallback(() => {
    // Force reset browser window viewport scroll shift
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }, []);


  // ── Firestore: real-time conversation list ─────────────────────────────────
  useEffect(() => {
    if (!db || !profile?.id) {
      setConversations([]);
      setConvoLoading(false);
      return;
    }

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", profile.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Conversation)
      );
      setConversations(sortByRecent(list));
      setConvoLoading(false);
    });

    return () => unsub();
  }, [profile?.id]);

  // ── Firestore: load historical messages on room change ─────────────────────
  useEffect(() => {
    if (!db || !selectedConversationId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "conversations", selectedConversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    getDocs(q)
      .then((snap) =>
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
        )
      )
      .catch(() => {});
  }, [selectedConversationId]);

  // ── markAsRead: emit socket event + optimistically flip local messages ─────
  const markAsRead = useCallback(
    (conversationId: string) => {
      if (!socket || !profile?.id) return;
      socket.emit("mark-as-read", { conversationId, userId: profile.id });
      // Optimistically mark all incoming messages in this convo as read locally
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId !== profile.id ? { ...m, read: true } : m
        )
      );
      // Clear unread flag for this conversation immediately
      setReadConvoIds((prev) => new Set([...prev, conversationId]));
    },
    [socket, profile?.id]
  );

  // ── Socket.IO: join/leave room + receive incoming messages ─────────────────
  useEffect(() => {
    if (!socket || !selectedConversationId || !profile?.id) return;

    socket.emit("join-room", {
      conversationId: selectedConversationId,
      userId: profile.id,
    });

    // Mark conversation as read the moment we join it
    markAsRead(selectedConversationId);

    // Incoming message from other users in the room
    const onReceiveMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      // Auto-mark as read since the chat is open
      markAsRead(selectedConversationId);
    };

    socket.on("receive-message", onReceiveMessage);

    return () => {
      socket.emit("leave-room", { conversationId: selectedConversationId });
      socket.off("receive-message", onReceiveMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedConversationId, profile?.id]);

  // ── Socket.IO: messages-read — recipient read our messages (show "Seen") ───
  useEffect(() => {
    if (!socket) return;

    const onMessagesRead = ({ conversationId }: { conversationId: string }) => {
      // If this event is for the currently open convo, mark all our sent messages as read
      if (conversationId === selectedConversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === profile?.id ? { ...m, read: true } : m
          )
        );
      }
    };

    socket.on("messages-read", onMessagesRead);
    return () => socket.off("messages-read", onMessagesRead);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedConversationId, profile?.id]);

  // ── Socket.IO: own sent message confirmation (always fires, even if offline) ─
  useEffect(() => {
    if (!socket) return;

    // Server emits this back to sender after Firestore save.
    // If a temp message exists (optimistic UI), replace it with the real one.
    // Otherwise just append (handles edge cases like page reload mid-send).
    const onMessageSent = (msg: Message & { tempId?: string }) => {
      console.log("Message confirmed from server:", msg);
      setMessages((prev) => {
        // Find the temp placeholder by tempId if provided
        const tempIdx = msg.tempId ? prev.findIndex((m) => m.id === msg.tempId) : -1;
        if (tempIdx !== -1) {
          // Swap the temp placeholder with the real confirmed message
          const updated = [...prev];
          updated[tempIdx] = { ...msg };
          return updated;
        }
        // No temp placeholder (e.g. browser refresh) — only append if not already present
        return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
      });
    };

    socket.on("message-sent", onMessageSent);

    return () => {
      socket.off("message-sent", onMessageSent);
    };
  }, [socket]);

  // ── Socket.IO: message-reacted — updates reactions on messages ─────────────
  useEffect(() => {
    if (!socket) return;

    const onMessageReacted = (data: { messageId: string; reactions: Record<string, string> }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    };

    socket.on("message-reacted", onMessageReacted);
    return () => {
      socket.off("message-reacted", onMessageReacted);
    };
  }, [socket]);

  // ── Socket.IO: global user online/offline status (now also carries lastSeen) ─
  useEffect(() => {
    if (!socket) return;

    const onStatus = (data: { userId: string; status: "online" | "offline"; lastSeen?: string | null }) => {
      setOnlineStatusMap((prev) => ({
        ...prev,
        [data.userId]: data.status === "online",
      }));
      if (data.status === "offline" && data.lastSeen !== undefined) {
        setLastSeenMap((prev) => ({ ...prev, [data.userId]: data.lastSeen ?? null }));
      }
      if (data.status === "online") {
        setLastSeenMap((prev) => ({ ...prev, [data.userId]: null }));
      }
    };

    socket.on("user-status", onStatus);
    return () => socket.off("user-status", onStatus);
  }, [socket]);

  // ── Socket.IO: query selected chat user's online status ────────────────────
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const selectedChatUser = useMemo(() => {
    if (!profile || !selectedConversation) return null;
    const otherId = selectedConversation.participants.find((p) => p !== profile.id);
    return users.find((u) => u.id === otherId) ?? null;
  }, [profile, selectedConversation, users]);

  // ── WebRTC Voice Call State & Hook ──────────────────────────────────────────
  const voiceCall = useVoiceCall(
    socket,
    profile,
    selectedChatUser,
    selectedConversationId
  );

  useEffect(() => {
    if (!socket || !selectedChatUser?.id) return;

    // Always re-check status when switching conversations (fixes stale offline display)
    socket.emit(
      "check-online-status",
      selectedChatUser.id,
      (isOnline: boolean) => {
        setOnlineStatusMap((prev) => ({
          ...prev,
          [selectedChatUser.id]: isOnline,
        }));

        // If offline, fetch lastSeen from Firestore
        if (!isOnline && db) {
          import("firebase/firestore").then(({ doc, getDoc }) => {
            getDoc(doc(db, "users", selectedChatUser.id))
              .then((snap) => {
                const ls = snap.data()?.lastSeen ?? null;
                setLastSeenMap((prev) => ({ ...prev, [selectedChatUser.id]: ls }));
              })
              .catch(() => {});
          });
        }
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedChatUser?.id]);

  // ── Socket.IO: query status for all inbox conversations on load ────────────────
  useEffect(() => {
    if (!socket || conversations.length === 0 || !profile?.id) return;

    conversations.forEach((convo) => {
      const otherId = convo.participants.find((p) => p !== profile.id);
      if (otherId) {
        socket.emit("check-online-status", otherId, (isOnline: boolean) => {
          setOnlineStatusMap((prev) => ({
            ...prev,
            [otherId]: isOnline,
          }));
        });
      }
    });
  }, [socket, conversations, profile?.id]);

  // ── Auto-scroll messages ────────────────────────────────────────────────────
  // Always scroll to bottom when conversation first loads (messages array changes from empty).
  // After that, only auto-scroll if user is already near the bottom (not scrolled up to read history).
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isInitialLoad = prevMsgCountRef.current === 0 && messages.length > 0;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (isInitialLoad || isNearBottom) {
      // Use instant scroll on initial load, smooth on new messages
      messagesEndRef.current?.scrollIntoView({
        behavior: isInitialLoad ? "instant" : "smooth",
      });
    }

    prevMsgCountRef.current = messages.length;
  }, [messages]);

  // ── Typing indicator: listen for partner's typing events ──────────────────
  useEffect(() => {
    if (!socket || !selectedConversationId || !selectedChatUser?.id) {
      setIsTyping(false);
      return;
    }

    const onUserTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      // Only care about this conversation and the other person (not ourselves)
      if (data.conversationId === selectedConversationId && data.userId === selectedChatUser.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on("user-typing", onUserTyping);
    return () => {
      socket.off("user-typing", onUserTyping);
      setIsTyping(false);
    };
  }, [socket, selectedConversationId, selectedChatUser?.id]);

  // ── Focus input when chat opens ────────────────────────────────────────────
  useEffect(() => {
    if (selectedConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversationId]);

  // ── Typing emit: debounced, fires on every keystroke ─────────────────────
  const handleTyping = useCallback(() => {
    if (!socket || !selectedConversationId || !profile?.id) return;
    // Emit typing-start
    socket.emit("typing-start", { conversationId: selectedConversationId, userId: profile.id });
    // Clear previous timer and set a new 2s stop timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { conversationId: selectedConversationId, userId: profile.id });
    }, 2000);
  }, [socket, selectedConversationId, profile?.id]);

  // ── Scroll to Message highlight helper ─────────────────────────────────────
  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-amber-400/20 border-amber-400/30");
      setTimeout(() => {
        el.classList.remove("bg-amber-400/20 border-amber-400/30");
      }, 1500);
    }
  }, []);

  // ── Audio Recording Handlers ───────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordStreamRef.current) {
          recordStreamRef.current.getTracks().forEach((track) => track.stop());
          recordStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone for recording:", err);
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    mediaRecorderRef.current.onstop = () => {
      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach((track) => track.stop());
        recordStreamRef.current = null;
      }

      if (shouldSend && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (socket && profile && selectedConversation) {
            socket.emit("send-message", {
              conversationId: selectedConversation.id,
              text: "🎤 Voice note",
              audioUrl: base64Audio,
              senderId: profile.id,
              recipientId: selectedChatUser?.id ?? "",
            });
          }
        };
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    stopRecording(false);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || !selectedConversation || !socket) return;
      const text = messageText.trim();
      if (!text) return;
      // Stop typing indicator immediately on send
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("typing-stop", { conversationId: selectedConversation.id, userId: profile.id });

      const replyPayload = replyingToMessage
        ? {
            id: replyingToMessage.id,
            text: replyingToMessage.text,
            senderId: replyingToMessage.senderId,
            senderName:
              users.find((u) => u.id === replyingToMessage.senderId)?.displayName || "User",
          }
        : undefined;

      // ── OPTIMISTIC UI: show message immediately without waiting for server ──
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        senderId: profile.id,
        text,
        createdAt: new Date().toISOString(),
        read: false,
        ...(replyPayload ? { replyTo: replyPayload } : {}),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setMessageText("");
      if (replyingToMessage) setReplyingToMessage(null);

      const payload: any = {
        conversationId: selectedConversation.id,
        text,
        senderId: profile.id,
        recipientId: selectedChatUser?.id ?? "",
        tempId, // pass tempId so we can swap it when server confirms
      };
      if (replyPayload) payload.replyTo = replyPayload;

      console.log("Emitting send-message to socket:", payload);
      socket.emit("send-message", payload);
    },
    [profile, selectedConversation, socket, messageText, selectedChatUser, replyingToMessage, users]
  );

  const openConvo = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      router.replace(`/nsgram/messages?convoId=${id}`);
      // Will trigger markAsRead inside the join-room effect when selectedConversationId changes
    },
    [router]
  );

  const closeConvo = useCallback(() => {
    setSelectedConversationId(null);
    router.replace("/nsgram/messages");
  }, [router]);

  const chatUserStatus = selectedChatUser
    ? (onlineStatusMap[selectedChatUser.id] ?? false)
    : false;
  const chatUserLastSeen = selectedChatUser
    ? (lastSeenMap[selectedChatUser.id] ?? null)
    : null;

  if (!profile) return null;

  // Height: 100vh - 56px NSGram header (pt-14 = 56px)
  const panelHeight = "h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]";

  return (
    <div
      className="flex gap-0 lg:gap-4 -mx-4 -my-6 sm:-mx-6 lg:-mx-8 overflow-hidden"
      style={{ height: "calc(100dvh - 56px)" }}
    >
      {/* ── Inbox Panel ───────────────────────────────────────────────────── */}
      <div
        className={`flex flex-col w-full lg:w-80 xl:w-96 shrink-0 border-r border-white/8 bg-slate-950 ${
          selectedConversationId ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Inbox header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Messages</h2>
            <p className="text-[10px] text-brand-500 mt-0.5">
              {conversations.length > 0
                ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
                : "No conversations yet"}
            </p>
          </div>
          <button
            onClick={() => router.push("/nsgram/search")}
            title="New message"
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 bg-white/5 hover:bg-amber-400/10 hover:border-amber-400/20 text-brand-400 hover:text-amber-300 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {convoLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyInbox onSearch={() => router.push("/nsgram/search")} />
          ) : (
            <div className="space-y-0.5 py-1">
              {conversations.map((convo) => {
                const otherId = convo.participants.find((p) => p !== profile.id);
                const chatUser = users.find((u) => u.id === otherId);
                // Show unread dot when: last message was sent by the other person AND
                // it hasn't been marked read yet (neither in Firestore nor optimistically)
                const hasUnread =
                  !!convo.lastMessageBy &&
                  convo.lastMessageBy !== profile.id &&
                  convo.lastMessageRead === false &&
                  !readConvoIds.has(convo.id);
                return (
                  <ConvoCard
                    key={convo.id}
                    convo={convo}
                    isActive={selectedConversationId === convo.id}
                    chatUser={chatUser}
                    isOnline={!!(otherId && onlineStatusMap[otherId])}
                    hasUnread={hasUnread}
                    onClick={() => openConvo(convo.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Panel ────────────────────────────────────────────────────── */}
      <div
        className={`flex flex-col flex-1 bg-slate-950 min-w-0 ${
          selectedConversationId ? "flex" : "hidden lg:flex"
        }`}
      >
        {selectedConversation && selectedChatUser ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button (mobile) */}
                <button
                  onClick={closeConvo}
                  className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl text-brand-400 hover:text-white hover:bg-white/5 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Avatar + name clickable container */}
                <Link
                  href={`/nsgram/profile/${selectedChatUser.id}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity group"
                >
                  {/* Avatar + status */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg select-none group-hover:border-amber-400/40 transition-colors">
                      {selectedChatUser.avatar === "girl" ? "👧" : "👦"}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                        chatUserStatus ? "bg-green-400" : "bg-brand-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight truncate group-hover:text-amber-300 transition-colors">
                      {selectedChatUser.displayName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-brand-500">
                        @{selectedChatUser.username}
                      </span>
                      {!isTyping && (
                        <>
                          <span className="text-brand-700">·</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              chatUserStatus ? "text-green-400" : "text-brand-600"
                            }`}
                          >
                            {chatUserStatus
                              ? "Online"
                              : chatUserLastSeen
                              ? formatLastSeen(chatUserLastSeen)
                              : "Offline"}
                          </span>
                        </>
                      )}
                      {isTyping && (
                        <>
                          <span className="text-brand-700">·</span>
                          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5">
                            typing
                            <span className="inline-flex gap-0.5 ml-0.5 items-end">
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Voice & Video Call Buttons + Real-time badge */}
              <div className="flex items-center gap-2">
                {/* Voice Call */}
                <button
                  onClick={() => voiceCall.initiateCall("voice")}
                  disabled={!chatUserStatus || voiceCall.callState !== "idle"}
                  title={chatUserStatus ? "Start Voice Call" : "User is offline"}
                  className="flex items-center justify-center w-8 h-8 rounded-xl border border-amber-400/20 bg-amber-400/8 text-amber-400 hover:bg-amber-400/25 hover:text-amber-300 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:text-brand-500 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>

                {/* Video Call */}
                <button
                  onClick={() => voiceCall.initiateCall("video")}
                  disabled={!chatUserStatus || voiceCall.callState !== "idle"}
                  title={chatUserStatus ? "Start Video Call" : "User is offline"}
                  className="flex items-center justify-center w-8 h-8 rounded-xl border border-amber-400/20 bg-amber-400/8 text-amber-400 hover:bg-amber-400/25 hover:text-amber-300 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:text-brand-500 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>

                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 select-none">
                  <span className="text-3xl mb-2">👋</span>
                  <p className="text-xs text-brand-500">
                    Say hi to{" "}
                    <span className="text-brand-300 font-semibold">
                      {selectedChatUser.displayName}
                    </span>
                    !
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMine = msg.senderId === profile.id;
                // "Seen" shows only under the LAST message sent by me (like Instagram)
                const isLastMine =
                  isMine &&
                  idx === messages.map((m, i) => m.senderId === profile.id ? i : -1).filter(i => i !== -1).at(-1);
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[60%] relative group border border-transparent rounded-2xl p-0.5 transition-all duration-300 ${
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    {/* Hover controls (quick reactions + quote replies) */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150 z-30 ${
                        isMine ? "right-full mr-3 flex-row-reverse" : "left-full ml-3 flex-row"
                      }`}
                    >
                      {/* Reply/Quote Trigger */}
                      <button
                        onClick={() => setReplyingToMessage(msg)}
                        type="button"
                        title="Reply"
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-brand-400 hover:text-white hover:bg-white/15 transition shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>

                      {/* Reactions Picker */}
                      <div className="flex items-center gap-0.5 rounded-full bg-slate-900 border border-white/10 px-1 py-0.5 shadow-lg select-none">
                        {["❤️", "😂", "👍", "🔥", "😮", "😢"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              if (socket && profile && selectedConversation) {
                                socket.emit("react-message", {
                                  conversationId: selectedConversation.id,
                                  messageId: msg.id,
                                  userId: profile.id,
                                  reaction: emoji,
                                });
                              }
                            }}
                            className="hover:scale-125 transition text-xs px-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Replies quoted header preview bubble */}
                    {msg.replyTo && (
                      <div
                        onClick={() => scrollToMessage(msg.replyTo!.id)}
                        className={`mb-0.5 text-[10px] px-3 py-1 rounded-xl bg-white/5 border border-white/5 opacity-60 text-white truncate max-w-full italic cursor-pointer select-none hover:opacity-100 transition-opacity ${
                          isMine ? "text-right" : "text-left"
                        }`}
                      >
                        <span className="font-bold block text-[8px] text-amber-300">
                          {msg.replyTo.senderId === profile.id ? "Replying to yourself" : `Replying to ${msg.replyTo.senderName}`}
                        </span>
                        {msg.replyTo.text}
                      </div>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm relative ${
                        isMine
                          ? "bg-amber-400 text-slate-950 font-medium rounded-br-md"
                          : "bg-white/8 text-white border border-white/8 rounded-bl-md"
                      }`}
                    >
                      {msg.audioUrl ? (
                        <VoiceNotePlayer audioUrl={msg.audioUrl} />
                      ) : (
                        msg.text
                      )}

                      {/* Message reactions badge */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`absolute -bottom-2.5 flex items-center gap-0.5 rounded-full bg-slate-900 border border-white/10 px-1.5 py-0.5 text-[9px] shadow-md z-10 select-none ${
                          isMine ? "right-2" : "left-2"
                        }`}>
                          {Array.from(new Set(Object.values(msg.reactions))).join(" ")}
                          {Object.keys(msg.reactions).length > 1 && (
                            <span className="text-[8px] text-brand-400 ml-0.5 font-bold">
                              {Object.keys(msg.reactions).length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.createdAt && (
                      <span className="text-[9px] text-brand-600 px-1">
                        {formatFull(msg.createdAt)}
                      </span>
                    )}
                    {/* "Seen" receipt — Instagram-style, only on the last sent message */}
                    {isLastMine && msg.read && (
                      <span className="flex items-center gap-1 text-[9px] text-brand-500 px-1 -mt-0.5 select-none">
                        <span className="text-[10px]">
                          {selectedChatUser?.avatar === "girl" ? "👧" : "👦"}
                        </span>
                        Seen
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quoted message reply preview banner */}
            {replyingToMessage && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/8 bg-white/3 select-none shrink-0">
                <div className="flex flex-col text-[11px] leading-snug truncate">
                  <span className="font-bold text-amber-300">
                    Replying to {replyingToMessage.senderId === profile.id ? "yourself" : users.find(u => u.id === replyingToMessage.senderId)?.displayName || "User"}
                  </span>
                  <span className="text-brand-400 truncate mt-0.5">{replyingToMessage.text}</span>
                </div>
                <button
                  onClick={() => setReplyingToMessage(null)}
                  className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10 text-brand-400 hover:text-white transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Message input / Voice note recording layout */}
            {isRecording ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/8 shrink-0 bg-slate-950 select-none animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Recording...</span>
                  <span className="font-mono text-sm ml-1 text-rose-300">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 text-brand-400 hover:text-rose-300 text-xs font-bold transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopRecording(true)}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md transition duration-200"
                  >
                    Send Voice Note
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 px-4 py-3 border-t border-white/8 shrink-0"
              >
                {/* Voice Note Record Trigger Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  title="Record Voice Note"
                  className="flex items-center justify-center w-10 h-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-brand-400 hover:text-rose-400 transition-all duration-200 shrink-0"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>

                <input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onFocus={handleInputFocus}
                  placeholder={`Message ${selectedChatUser.displayName}…`}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-brand-600 outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:bg-white/10 disabled:text-brand-600 text-slate-950 transition-all duration-200 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            )}
          </>
        ) : (
          /* No chat selected — desktop placeholder */
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 text-center px-8 select-none">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl border border-white/8 bg-white/3 flex items-center justify-center text-5xl shadow-inner">
                💬
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-sm">
                ✉️
              </div>
            </div>
            <h2 className="text-base font-bold text-white mb-2">Your Messages</h2>
            <p className="text-xs text-brand-500 max-w-[220px] leading-relaxed mb-5">
              Select a conversation from the list or start a new one.
            </p>
            <button
              onClick={() => router.push("/nsgram/search")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 text-xs transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find People
            </button>
          </div>
        )}
      </div>

      {/* Voice Call UI Overlays */}
      <IncomingCallModal
        info={voiceCall.incomingCallInfo}
        onAccept={voiceCall.acceptCall}
        onDecline={voiceCall.declineCall}
      />
      
      {(voiceCall.callState === "calling" || voiceCall.callState === "in-call") && (
        <ActiveCallOverlay
          callState={voiceCall.callState}
          callType={voiceCall.callType}
          connectionStatus={voiceCall.connectionStatus}
          isMuted={voiceCall.isMuted}
          isCameraOn={voiceCall.isCameraOn}
          duration={voiceCall.callDuration}
          partnerName={selectedChatUser?.displayName || voiceCall.incomingCallInfo?.callerName || ""}
          partnerAvatar={selectedChatUser?.avatar || voiceCall.incomingCallInfo?.callerAvatar || "boy"}
          localStream={voiceCall.localStream}
          remoteStream={voiceCall.remoteStream}
          onEndCall={voiceCall.endCall}
          onToggleMute={voiceCall.toggleMute}
          onToggleCamera={voiceCall.toggleCamera}
        />
      )}

      <CallErrorBanner message={voiceCall.callErrorMessage} />
    </div>
  );
}
