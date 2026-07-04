"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";

type AvatarType = "boy" | "girl";
type AuthMode = "login" | "signup";

type UserProfile = {
  id: string;
  uid: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  avatar: AvatarType;
  role: "admin" | "user";
  createdAt?: Timestamp | string | null;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: Timestamp | string | null;
  read?: boolean;
  reactions?: Record<string, string[]>;
};

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp | string | null;
  lastMessageBy?: string;
  createdAt?: Timestamp | string | null;
};

const emptyAuthForm = {
  email: "",
  password: "",
  displayName: "",
  username: "",
  bio: "",
  avatar: "boy" as AvatarType,
};

function formatTime(value: Timestamp | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value instanceof Date ? value : value.toDate();
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortTime(value: Timestamp | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value instanceof Date ? value : value.toDate();
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getConversationId(a: string, b: string) {
  return [a, b].sort().join("_");
}

export default function NsgramApp() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      setLoading(false);
      setNotice("Connect Firebase to enable real-time authentication and chat.");
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      unsubscribeProfile?.();
      unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const latestUsers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        uid: docSnap.id,
        ...(docSnap.data() as Omit<UserProfile, "id" | "uid">),
      })) as UserProfile[];
      setUsers(latestUsers);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (!db || !profile?.id) {
      setConversations([]);
      return;
    }

    const convoQuery = query(collection(db, "conversations"), where("participants", "array-contains", profile.id));
    const unsubscribeConversations = onSnapshot(convoQuery, (snapshot) => {
      const latestConversations = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Conversation, "id">) }) as Conversation)
        .sort((a, b) => {
          const aTime =
            a.lastMessageAt
              ? new Date(
                typeof a.lastMessageAt === "string"
                  ? a.lastMessageAt
                  : a.lastMessageAt.toDate()
              ).getTime()
              : 0;

          const bTime =
            b.lastMessageAt
              ? new Date(
                typeof b.lastMessageAt === "string"
                  ? b.lastMessageAt
                  : b.lastMessageAt.toDate()
              ).getTime()
              : 0;

          return bTime - aTime;
        });
      setConversations(latestConversations);
    });

    return () => unsubscribeConversations();
  }, [profile?.id]);

  useEffect(() => {
    if (!db || !selectedConversationId) {
      setMessages([]);
      return;
    }

    const messagesRef = query(collection(db, "conversations", selectedConversationId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
      setMessages(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Message, "id">) })) as Message[]);
    });

    return () => unsubscribeMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleUsers = useMemo(() => {
    if (!profile) return [];
    const value = search.trim().toLowerCase();
    const filtered = users.filter((user) => user.id !== profile.id);
    if (!value) return filtered;
    return filtered.filter((user) => `${user.displayName} ${user.username}`.toLowerCase().includes(value));
  }, [profile, search, users]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  const selectedChatUser = useMemo(() => {
    if (!profile || !selectedConversation) return null;
    const otherUserId = selectedConversation.participants.find((participantId) => participantId !== profile.id);
    return users.find((user) => user.id === otherUserId) ?? null;
  }, [profile, selectedConversation, users]);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!isConfigured || !auth || !db) {
      setNotice("Firebase is not configured yet. Add your Firebase environment values to enable sign-up and chat.");
      return;
    }

    const email = authForm.email.trim();
    const password = authForm.password.trim();
    const username = authForm.username.trim().toLowerCase();

    if (!email || !password) {
      setNotice("Please enter your email and password.");
      return;
    }

    if (authMode === "signup") {
      if (!authForm.displayName.trim()) {
        setNotice("Please enter your display name.");
        return;
      }
      if (!username) {
        setNotice("Please enter a unique username.");
        return;
      }

      const usernameSnapshot = await getDocs(query(collection(db, "users"), where("username", "==", username)));
      if (!usernameSnapshot.empty) {
        setNotice("That username is already taken.");
        return;
      }

      setAuthLoading(true);
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user profile via backend API (role defaults to 'user')
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        await fetch(`${backendUrl}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: credential.user.uid,
            displayName: authForm.displayName.trim(),
            username,
            email,
            bio: authForm.bio.trim(),
            avatar: authForm.avatar,
          }),
        });

        setNotice("Account created successfully.");
        setAuthForm(emptyAuthForm);
        setAuthMode("login");
      } catch (error) {
        console.error(error);
        setNotice("Signup failed. Please try again.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    setAuthLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Update lastLoginAt via backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      fetch(`${backendUrl}/api/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: credential.user.uid,
          email: credential.user.email,
        }),
      }).catch(err => console.error('Failed to update lastLoginAt:', err));

      setNotice("Signed in successfully.");
    } catch (error) {
      console.error(error);
      setNotice("Invalid email or password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setMessageText("");
    setSelectedConversationId(null);
    setNotice("Signed out.");
  };

  const openConversation = async (user: UserProfile) => {
    if (!profile || !db) return;
    const conversationId = getConversationId(profile.id, user.id);
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        participants: [profile.id, user.id],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        lastMessageBy: "",
      },
      { merge: true },
    );
    setSelectedConversationId(conversationId);
    setNotice(`Opened chat with ${user.displayName}`);
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !selectedConversation || !db) return;
    const text = messageText.trim();
    if (!text) return;

    const conversationRef = doc(db, "conversations", selectedConversation.id);
    await addDoc(collection(conversationRef, "messages"), {
      senderId: profile.id,
      text,
      createdAt: serverTimestamp(),
      read: false,
      reactions: {},
    });
    await updateDoc(conversationRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: profile.id,
    });
    setMessageText("");
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!profile || !selectedConversation || !db) return;

    const targetMessage = messages.find((message) => message.id === messageId);
    if (!targetMessage) return;

    const nextReactions = { ...(targetMessage.reactions ?? {}) };
    const previousEmoji = Object.entries(nextReactions).find(([, userIds]) => userIds.includes(profile.id))?.[0];

    if (previousEmoji) {
      nextReactions[previousEmoji] = (nextReactions[previousEmoji] ?? []).filter((userId) => userId !== profile.id);
      if (!nextReactions[previousEmoji].length) {
        delete nextReactions[previousEmoji];
      }
    }

    if (previousEmoji !== emoji) {
      nextReactions[emoji] = [...(nextReactions[emoji] ?? []), profile.id];
    }

    await updateDoc(doc(db, "conversations", selectedConversation.id, "messages", messageId), {
      reactions: nextReactions,
    });
  };

  const handleDeleteProfile = async (userToDelete: UserProfile) => {
    if (!db || !profile || profile.role !== "admin") return;
    if (userToDelete.id === profile.id) {
      setNotice("You cannot delete your own admin profile.");
      return;
    }

    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      setNotice(`${userToDelete.displayName}'s profile was removed.`);
    } catch (error) {
      console.error(error);
      setNotice("Unable to delete that profile right now.");
    }
  };

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-brand-100">
        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">Loading your community workspace…</p>
      </section>
    );
  }

  if (!profile || !authUser) {
    return (
      <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_45%)] px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30 backdrop-blur xl:p-10">
            <p className="mb-4 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
              Community
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">A real-time community for conversations that stay saved.</h1>
            <p className="mt-4 text-base text-brand-300 sm:text-lg">
              Create an account, find people by username, and open a one-to-one chat that stays in Firestore and updates instantly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setAuthMode("signup")} className="rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300">
                Create account
              </button>
              <button onClick={() => setAuthMode("login")} className="rounded-full border border-white/10 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10">
                Log in
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{authMode === "login" ? "Log in" : "Create account"}</h2>
              <span className="text-sm text-brand-400">Firebase auth</span>
            </div>
            <form className="space-y-4" onSubmit={handleAuth}>
              {authMode === "signup" ? (
                <>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Display name"
                    value={authForm.displayName}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Username"
                    value={authForm.username}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, username: event.target.value.toLowerCase() }))}
                  />
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Short bio"
                    value={authForm.bio}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, bio: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    {(["boy", "girl"] as AvatarType[]).map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setAuthForm((prev) => ({ ...prev, avatar }))}
                        className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-semibold ${authForm.avatar === avatar ? "border-amber-400 bg-amber-400/20 text-amber-200" : "border-white/10 bg-white/5 text-brand-200"}`}
                      >
                        {avatar === "boy" ? "👦 Boy" : "👧 Girl"}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              <button disabled={authLoading} className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-70">
                {authLoading ? "Working…" : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
            {notice ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-brand-300">{notice}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_45%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-white/10 bg-slate-950/75 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">Community</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{profile.displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-brand-300">Search users, start real-time one-to-one chats, and keep every message stored in Firestore.</p>
            </div>
            <button onClick={handleLogout} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Log out
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Find people</h2>
                  <p className="text-sm text-brand-400">Search by display name or username.</p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">Live</span>
              </div>
              <input
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 outline-none"
                placeholder="Search users"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="mt-4 space-y-2">
                {visibleUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openConversation(user)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-brand-400">@{user.username}</p>
                    </div>
                    <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200">Chat</span>
                  </button>
                ))}
                {!visibleUsers.length ? <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-brand-400">No users found yet.</p> : null}
              </div>
            </div>

            {profile.role === "admin" ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Admin tools</h2>
                    <p className="text-sm text-brand-400">Delete user profiles from the dashboard.</p>
                  </div>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">Admin</span>
                </div>
                <div className="mt-4 space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold">{user.displayName}</p>
                        <p className="text-xs text-brand-400">@{user.username}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProfile(user)}
                        className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200"
                      >
                        Delete profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent chats</h2>
                <span className="text-sm text-brand-400">Saved in Firestore</span>
              </div>
              <div className="mt-4 space-y-2">
                {conversations.map((conversation) => {
                  const chatUser = users.find((user) => user.id === conversation.participants.find((participantId) => participantId !== profile.id));
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`flex w-full items-start justify-between rounded-2xl border px-3 py-3 text-left ${selectedConversationId === conversation.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/5"}`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{chatUser?.displayName ?? "Conversation"}</p>
                        <p className="mt-1 text-xs text-brand-400">{conversation.lastMessage || "Start the conversation"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-brand-400">{conversation.lastMessageAt ? formatShortTime(conversation.lastMessageAt) : ""}</p>
                      </div>
                    </button>
                  );
                })}
                {!conversations.length ? <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-brand-400">No conversations yet. Search a user to start one.</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
            {selectedConversation && selectedChatUser ? (
              <>
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-lg font-semibold">{selectedChatUser.displayName}</p>
                    <p className="text-sm text-brand-400">@{selectedChatUser.username}</p>
                  </div>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">Real-time</span>
                </div>

                <div className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  {messages.map((message) => {
                    const reactionOptions = ["👍", "❤️", "😂", "👎"];
                    return (
                      <div key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 ${message.senderId === profile.id ? "ml-auto bg-amber-400/20" : "bg-white/5"}`}>
                        <p className="text-sm text-brand-100">{message.text}</p>
                        <p className="mt-1 text-[11px] text-brand-400">{message.createdAt ? formatTime(message.createdAt) : ""}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {reactionOptions.map((emoji) => {
                            const users = message.reactions?.[emoji] ?? [];
                            const active = users.includes(profile.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReactToMessage(message.id, emoji)}
                                className={`rounded-full border px-2 py-1 text-xs ${active ? "border-amber-400 bg-amber-400/20 text-amber-200" : "border-white/10 bg-white/5 text-brand-200"}`}
                              >
                                {emoji} {users.length ? users.length : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2.5 outline-none"
                    placeholder="Type a message"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                  />
                  <button className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">Send</button>
                </form>
              </>
            ) : (
              <div className="flex h-full min-h-[480px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-brand-400">
                <div>
                  <p className="text-lg font-semibold text-brand-100">Start a conversation</p>
                  <p className="mt-2 text-sm">Search for another registered user and open a one-to-one chat. Messages will be stored permanently in Firestore and update in real time.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
