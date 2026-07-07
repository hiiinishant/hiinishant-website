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

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: Timestamp | string | null;
  read?: boolean;
};

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp | string | null;
  lastMessageBy?: string;
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

function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const aT = toDate(a.lastMessageAt)?.getTime() ?? 0;
    const bT = toDate(b.lastMessageAt)?.getTime() ?? 0;
    return bT - aT;
  });
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
  onClick,
}: {
  convo: Conversation;
  isActive: boolean;
  chatUser: { displayName: string; username: string; avatar: string } | undefined;
  isOnline: boolean;
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
          <p className="text-sm font-semibold text-white truncate leading-tight">
            {chatUser?.displayName ?? "Unknown"}
          </p>
          {convo.lastMessageAt && (
            <span className="text-[10px] text-brand-500 whitespace-nowrap shrink-0">
              {formatRelative(convo.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-brand-500 leading-tight mb-0.5">
          @{chatUser?.username ?? "—"}
        </p>
        <p
          className={`text-xs truncate leading-snug ${
            convo.lastMessage ? "text-brand-400" : "text-brand-600 italic"
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
  const [convoLoading, setConvoLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ── Sync convoId from URL ──────────────────────────────────────────────────
  useEffect(() => {
    const id = searchParams.get("convoId");
    if (id) setSelectedConversationId(id);
  }, [searchParams]);

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

  // ── Socket.IO: join/leave room + receive incoming messages ─────────────────
  useEffect(() => {
    if (!socket || !selectedConversationId || !profile?.id) return;

    socket.emit("join-room", {
      conversationId: selectedConversationId,
      userId: profile.id,
    });

    // Incoming message from other users in the room
    const onReceiveMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };

    socket.on("receive-message", onReceiveMessage);

    return () => {
      socket.emit("leave-room", { conversationId: selectedConversationId });
      socket.off("receive-message", onReceiveMessage);
    };
  }, [socket, selectedConversationId, profile?.id]);

  // ── Socket.IO: own sent message confirmation (always fires, even if offline) ─
  useEffect(() => {
    if (!socket) return;

    // Server emits this directly to the sender's socket after saving
    // — bypasses room-join so the sender always sees their message
    const onMessageSent = (msg: Message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };

    socket.on("message-sent", onMessageSent);

    return () => {
      socket.off("message-sent", onMessageSent);
    };
  }, [socket]);

  // ── Socket.IO: global user online/offline status ───────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onStatus = (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineStatusMap((prev) => ({
        ...prev,
        [data.userId]: data.status === "online",
      }));
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

  useEffect(() => {
    if (!socket || !selectedChatUser?.id) return;
    socket.emit(
      "check-online-status",
      selectedChatUser.id,
      (isOnline: boolean) => {
        setOnlineStatusMap((prev) => ({
          ...prev,
          [selectedChatUser.id]: isOnline,
        }));
      }
    );
  }, [socket, selectedChatUser]);

  // ── Auto-scroll messages ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when chat opens ────────────────────────────────────────────
  useEffect(() => {
    if (selectedConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversationId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || !selectedConversation || !socket) return;
      const text = messageText.trim();
      if (!text) return;
      socket.emit("send-message", {
        conversationId: selectedConversation.id,
        text,
        senderId: profile.id,
        recipientId: selectedChatUser?.id ?? "",
      });
      setMessageText("");
    },
    [profile, selectedConversation, socket, messageText, selectedChatUser]
  );

  const openConvo = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      router.replace(`/nsgram/messages?convoId=${id}`);
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

  if (!profile) return null;

  // Height: 100vh - 56px NSGram header (pt-14 = 56px)
  const panelHeight = "h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]";

  return (
    <div
      className={`flex gap-0 lg:gap-4 ${panelHeight} -mx-4 -my-6 sm:-mx-6 lg:-mx-8 overflow-hidden`}
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
                return (
                  <ConvoCard
                    key={convo.id}
                    convo={convo}
                    isActive={selectedConversationId === convo.id}
                    chatUser={chatUser}
                    isOnline={!!(otherId && onlineStatusMap[otherId])}
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

                {/* Avatar + status */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg select-none">
                    {selectedChatUser.avatar === "girl" ? "👧" : "👦"}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      chatUserStatus ? "bg-green-400" : "bg-brand-600"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight truncate">
                    {selectedChatUser.displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-brand-500">
                      @{selectedChatUser.username}
                    </span>
                    <span className="text-brand-700">·</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        chatUserStatus ? "text-green-400" : "text-brand-600"
                      }`}
                    >
                      {chatUserStatus ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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

              {messages.map((msg) => {
                const isMine = msg.senderId === profile.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[60%] ${
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                        isMine
                          ? "bg-amber-400 text-slate-950 font-medium rounded-br-md"
                          : "bg-white/8 text-white border border-white/8 rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.createdAt && (
                      <span className="text-[9px] text-brand-600 px-1">
                        {formatFull(msg.createdAt)}
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 px-4 py-3 border-t border-white/8 shrink-0"
            >
              <input
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
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
    </div>
  );
}
