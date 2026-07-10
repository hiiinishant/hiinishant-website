"use client";

import React, { useState, type FormEvent } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNsgramAuth, type AvatarType } from "@/components/nsgram/NsgramAuthProvider";

export default function NsgramProfilePage() {
  const { profile } = useNsgramAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatar, setAvatar] = useState<AvatarType>(profile?.avatar || "boy");
  const [isUpdating, setIsUpdating] = useState(false);
  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Sync state once when profile first loads
  const loadedRef = React.useRef(false);
  React.useEffect(() => {
    if (profile && !loadedRef.current) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setAvatar(profile.avatar);
      loadedRef.current = true;
    }
  }, [profile]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !db) return;

    if (!displayName.trim()) {
      setNotice("Display name cannot be empty.");
      return;
    }

    setIsUpdating(true);
    setNotice("");

    try {
      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar,
      });

      // Update via backend API too (optional, but good for database consistency if backend tracks login/profile history)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      if (backendUrl) {
        await fetch(`${backendUrl}/api/users/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: profile.id,
            displayName: displayName.trim(),
            bio: bio.trim(),
            avatar,
          }),
        }).catch((err) => console.error("Backend profile sync warning:", err));
      }

      setNotice("Profile updated successfully!");
      setTimeout(() => {
        setIsEditing(false);
        setNotice("");
      }, 1000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setNotice("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) return null;

  if (!isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        {/* Profile Overview Card */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-xl backdrop-blur">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-400/5 blur-[80px]" />
          
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 relative z-10">
            {/* Avatar badge */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-5xl shadow-inner select-none shrink-0">
              {profile.avatar === "girl" ? "👧" : "👦"}
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
              <div>
                <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  {profile.role === "admin" ? "Admin" : "Community Member"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mt-1.5 truncate">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-brand-400">@{profile.username}</p>
              </div>

              {profile.bio ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 italic text-sm text-brand-300 leading-relaxed">
                  &ldquo;{profile.bio}&rdquo;
                </div>
              ) : (
                <p className="text-xs text-brand-500 italic">No bio written yet.</p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 text-xs font-bold transition-all duration-300 shadow-md shadow-amber-400/10"
                >
                  Edit Profile Settings
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Profile Edit Card */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-white tracking-wide">Edit Profile</h1>
        <p className="text-sm text-brand-400 mt-1">Manage your identity and avatar settings across Nsgram.</p>

        <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-300 mb-2">
              Choose Avatar
            </label>
            <div className="flex gap-4">
              {(["boy", "girl"] as AvatarType[]).map((type) => {
                const isActive = avatar === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAvatar(type)}
                    className={`flex-1 rounded-2xl border px-4 py-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                      isActive
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-white/5 bg-white/5 text-brand-400 hover:border-white/10"
                    }`}
                  >
                    <span className="text-3xl select-none">{type === "boy" ? "👦" : "👧"}</span>
                    <span className="text-xs font-bold tracking-wide uppercase">{type === "boy" ? "Boy" : "Girl"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-400 mb-1.5">
              Email Address (Cannot change)
            </label>
            <input
              type="text"
              disabled
              value={profile.email}
              className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 outline-none text-brand-500 text-sm select-none"
            />
          </div>

          {/* Username (Readonly) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-400 mb-1.5">
              Username (Unique)
            </label>
            <input
              type="text"
              disabled
              value={`@${profile.username}`}
              className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 outline-none text-brand-500 text-sm select-none"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 text-white placeholder-brand-500 text-sm transition"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-300 mb-1.5">
              Short Bio
            </label>
            <textarea
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 text-white placeholder-brand-500 text-sm transition"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setDisplayName(profile.displayName);
                setBio(profile.bio);
                setAvatar(profile.avatar);
                setNotice("");
                setIsEditing(false);
              }}
              className="flex-1 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 text-slate-950 font-bold py-3 text-sm tracking-wide uppercase transition duration-300 shadow-md shadow-amber-400/10"
            >
              {isUpdating ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {notice && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-brand-300 animate-fadeIn">
            {notice}
          </div>
        )}
      </section>
    </div>
  );
}
