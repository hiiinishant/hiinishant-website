"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNsgramAuth, type UserProfile } from "@/components/nsgram/NsgramAuthProvider";

export default function NsgramUserProfileDetailPage() {
  const { id } = useParams() as { id: string };
  const { profile, users, loading } = useNsgramAuth();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const targetUser = users.find((u) => u.id === id);

  const getConversationId = (a: string, b: string) => {
    return [a, b].sort().join("_");
  };

  const startChat = async (target: UserProfile) => {
    if (!profile || !db) return;
    setChatLoading(true);
    const conversationId = getConversationId(profile.id, target.id);
    try {
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          participants: [profile.id, target.id],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          lastMessageBy: "",
        },
        { merge: true }
      );
      router.push(`/nsgram/messages?convoId=${conversationId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setNotice("Could not start chat. Please try again.");
    } finally {
      setChatLoading(false);
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
        setTimeout(() => {
          router.push("/nsgram/search");
        }, 1500);
      } catch (error) {
        console.error(error);
        setNotice("Unable to delete that profile right now.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-100 animate-fadeIn">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mb-4" />
        <p className="text-sm text-brand-400">Loading profile details...</p>
      </div>
    );
  }

  if (!profile) return null;

  if (!targetUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4 animate-fadeIn">
        <div className="text-5xl">🕵️‍♂️</div>
        <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
        <p className="text-sm text-brand-400">
          The requested member profile could not be found in the community directory.
        </p>
        <button
          onClick={() => router.push("/nsgram/search")}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all duration-300"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isOwnProfile = targetUser.id === profile.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Back navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 hover:text-white transition-colors duration-300 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Profile Overview Card */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-xl backdrop-blur">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-400/5 blur-[80px]" />
        
        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 relative z-10">
          {/* Avatar badge */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-5xl shadow-inner select-none shrink-0">
            {targetUser.avatar === "girl" ? "👧" : "👦"}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div>
              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                {targetUser.role === "admin" ? "Admin" : "Community Member"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mt-1.5 truncate">
                {targetUser.displayName}
              </h1>
              <p className="text-sm text-brand-400">@{targetUser.username}</p>
            </div>

            {targetUser.bio ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 italic text-sm text-brand-300 leading-relaxed text-left">
                &ldquo;{targetUser.bio}&rdquo;
              </div>
            ) : (
              <p className="text-xs text-brand-500 italic">No bio written yet.</p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center sm:justify-start">
              {isOwnProfile ? (
                <button
                  onClick={() => router.push("/nsgram/profile")}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 text-xs font-bold transition-all duration-300 shadow-md shadow-amber-400/10 cursor-pointer"
                >
                  Edit Profile Settings
                </button>
              ) : (
                <>
                  <button
                    onClick={() => startChat(targetUser)}
                    disabled={chatLoading}
                    className="rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 text-slate-950 px-5 py-2.5 text-xs font-bold transition-all duration-300 shadow-md shadow-amber-400/10 cursor-pointer"
                  >
                    {chatLoading ? "Initializing Chat..." : `Message @${targetUser.username}`}
                  </button>

                  {profile.role === "admin" && (
                    <button
                      onClick={() => handleDeleteProfile(targetUser)}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-4 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer"
                    >
                      Delete Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-brand-300 animate-fadeIn">
          {notice}
        </div>
      )}
    </div>
  );
}
