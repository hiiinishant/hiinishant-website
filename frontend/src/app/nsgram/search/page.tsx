"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNsgramAuth, type UserProfile } from "@/components/nsgram/NsgramAuthProvider";

export default function NsgramSearchPage() {
  const { profile, users } = useNsgramAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const getConversationId = (a: string, b: string) => {
    return [a, b].sort().join("_");
  };

  const visibleUsers = useMemo(() => {
    if (!profile) return [];
    const queryStr = searchQuery.trim().toLowerCase();
    const filtered = users.filter((u) => u.id !== profile.id);
    if (!queryStr) return filtered;
    return filtered.filter((u) =>
      `${u.displayName} ${u.username}`.toLowerCase().includes(queryStr)
    );
  }, [profile, searchQuery, users]);

  const startChat = async (targetUser: UserProfile) => {
    if (!profile || !db) return;
    const conversationId = getConversationId(profile.id, targetUser.id);
    try {
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          participants: [profile.id, targetUser.id],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          lastMessageBy: "",
        },
        { merge: true }
      );
      // Redirect to messages page with target user's conversation query
      router.push(`/nsgram/messages?convoId=${conversationId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setNotice("Could not start chat. Please try again.");
    }
  };

  const handleDeleteProfile = async (userToDelete: UserProfile) => {
    if (!db || !profile || profile.role !== "admin") return;
    if (userToDelete.id === profile.id) {
      setNotice("You cannot delete your own admin profile.");
      return;
    }
    if (confirm(`Are you sure you want to delete profile @${userToDelete.username}?`)) {
      try {
        await deleteDoc(doc(db, "users", userToDelete.id));
        setNotice(`${userToDelete.displayName}'s profile was removed.`);
      } catch (error) {
        console.error(error);
        setNotice("Unable to delete that profile right now.");
      }
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-white tracking-wide">Find People</h1>
        <p className="text-sm text-brand-400 mt-1">Search the directory to open instant, real-time chats.</p>
        
        <div className="mt-4 relative">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 text-white placeholder-brand-500 text-sm transition-all duration-300"
            placeholder="Search by display name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute top-1/2 -translate-y-1/2 left-4 text-brand-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Directory Results */}
      <div className="grid gap-4 sm:grid-cols-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => startChat(user)}
            className="rounded-3xl border border-white/10 bg-slate-900/30 p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-amber-400/40 hover:bg-slate-900/50 hover:cursor-pointer transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl select-none shrink-0 group-hover:scale-105 transition-all">
                {user.avatar === "girl" ? "👧" : "👦"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">{user.displayName}</p>
                <p className="text-xs text-brand-400 truncate">@{user.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => startChat(user)}
                className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 text-xs font-bold transition-all duration-300"
              >
                Chat
              </button>

              {profile.role === "admin" && (
                <button
                  onClick={() => handleDeleteProfile(user)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-2 text-xs font-bold transition-all duration-300"
                  title="Admin: Delete user profile"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {visibleUsers.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
            <p className="text-sm text-brand-400">No community members found matching that search.</p>
          </div>
        )}
      </div>

      {notice && (
        <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-brand-300 animate-fadeIn">
          {notice}
        </div>
      )}
    </div>
  );
}
