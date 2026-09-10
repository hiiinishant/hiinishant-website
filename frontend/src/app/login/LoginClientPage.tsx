"use client";

import React, { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  reload,
  getIdToken,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";
import { getSafeRedirect } from "@/lib/auth-redirect";

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
  isActivated?: boolean;
};

type PendingSignupProfile = {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  avatar: AvatarType;
};

const emptyAuthForm = {
  email: "",
  password: "",
  displayName: "",
  username: "",
  bio: "",
  avatar: "boy" as AvatarType,
  rememberMe: true,
};

export default function LoginClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") === "signup" ? "signup" : "login") as AuthMode;
  const redirectTarget = getSafeRedirect(searchParams.get("redirect"), "/");

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: "info" | "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const pendingSignupStorageKey = "hiiinishant_pending_signup";
  const [activationNoticeVisible, setActivationNoticeVisible] = useState(false);

  // Sync auth mode from query param if changed
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup" || mode === "login") {
      setAuthMode(mode);
    }
  }, [searchParams]);

  // Firebase auth state observer
  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      setLoading(false);
      setNotice({
        text: "Firebase is currently in demo mode. Connect Firebase to authenticate.",
        type: "info",
      });
      return;
    }

    const firestoreDb = db;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(firestoreDb, "users", user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Redirect if already logged in and verified
  useEffect(() => {
    if (!loading && !activationNoticeVisible && authUser && authUser.emailVerified && profile?.isActivated) {
      router.replace(redirectTarget);
    }
  }, [activationNoticeVisible, authUser, profile, loading, router, redirectTarget]);

  const completeVerifiedSignup = useCallback(async (currentUser: FirebaseUser) => {
    if (!auth || !db || !currentUser.email) return false;

    const storedSignup = window.localStorage.getItem(pendingSignupStorageKey);
    const pendingSignup = storedSignup ? JSON.parse(storedSignup) as PendingSignupProfile : null;
    const profileRes = await fetch(`${API_BASE}/api/users/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getIdToken(currentUser)}`,
      },
      body: JSON.stringify({
        uid: currentUser.uid,
        displayName: pendingSignup?.uid === currentUser.uid ? pendingSignup.displayName : undefined,
        username: pendingSignup?.uid === currentUser.uid ? pendingSignup.username : undefined,
        bio: pendingSignup?.uid === currentUser.uid ? pendingSignup.bio : undefined,
        avatar: pendingSignup?.uid === currentUser.uid ? pendingSignup.avatar : undefined,
        email: currentUser.email,
        isActivated: true,
      }),
    });

    if (!profileRes.ok) throw new Error("Account activation failed. Please try again.");
    window.localStorage.removeItem(pendingSignupStorageKey);

    const snapshot = await getDoc(doc(db, "users", currentUser.uid));
    if (snapshot.exists()) {
      const data = snapshot.data();
      setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
    }
    setAuthUser(currentUser);
    setNotice({
      text: "Account created! A verification link has been sent to your email. Please check your inbox and click the verification link to activate full NSGram, Quiz & Gallery access.",
      type: "success",
    });
    setActivationNoticeVisible(true);
    window.setTimeout(() => router.replace(redirectTarget), 1800);
    return true;
  }, [pendingSignupStorageKey, redirectTarget, router]);

  // Auto check email verification on window focus
  const checkVerificationStatus = useCallback(async () => {
    if (!authUser || authUser.emailVerified || !auth || !db) return;
    try {
      await reload(authUser);
      const currentUser = auth.currentUser;
      if (currentUser?.emailVerified) {
        await completeVerifiedSignup(currentUser);
      }
    } catch {
      // Silent error in background check
    }
  }, [authUser, completeVerifiedSignup]);

  useEffect(() => {
    const handleFocus = () => {
      if (authUser && !authUser.emailVerified) {
        checkVerificationStatus();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authUser, checkVerificationStatus]);

  const handleResendVerification = async () => {
    if (!authUser) return;
    setAuthLoading(true);
    setNotice(null);
    try {
      await sendEmailVerification(authUser);
      setNotice({
        text: "Verification email resent! Please check your inbox and spam folder.",
        type: "success",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setNotice({ text: message || "Failed to resend verification email.", type: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualVerificationCheck = async () => {
    if (!authUser || !auth || !db) return;
    setAuthLoading(true);
    setNotice(null);
    try {
      await reload(authUser);
      const currentUser = auth.currentUser;
      if (currentUser?.emailVerified) {
        await completeVerifiedSignup(currentUser);
      } else {
        setNotice({
          text: "Email not verified yet. Please click the link sent to your inbox.",
          type: "error",
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setNotice({ text: message || "Verification check failed.", type: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      if (auth) await signOut(auth);
      setAuthUser(null);
      setProfile(null);
      setNotice({ text: "Signed out successfully.", type: "info" });
    } catch {
      setNotice({ text: "Failed to sign out.", type: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setNotice({ text: "Firebase authentication is not configured.", type: "error" });
      return;
    }
    const email = resetEmail.trim();
    if (!email) {
      setNotice({ text: "Please enter your email address.", type: "error" });
      return;
    }
    setAuthLoading(true);
    setNotice(null);
    try {
      // Call backend which uses Gmail SMTP — reliably lands in inbox (not spam)
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setNotice({ text: data.error || "Failed to send reset email. Please try again.", type: "error" });
        return;
      }
      setNotice({ text: data.message || "Password reset link sent! Check your inbox.", type: "success" });
      setForgotPassword(false);
      setResetEmail("");
    } catch {
      setNotice({ text: "Network error. Please check your connection and try again.", type: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured || !auth || !db) {
      setNotice({ text: "Firebase is not configured yet.", type: "error" });
      return;
    }

    setAuthLoading(true);
    setNotice(null);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      const userRef = doc(db, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        let baseUsername =
          credential.user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") ||
          credential.user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "user";

        if (baseUsername.length < 3) baseUsername = baseUsername + "123";

        let uniqueUsername = baseUsername;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          try {
            const checkRes = await fetch(`${API_BASE}/api/users/check-username?username=${encodeURIComponent(uniqueUsername)}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.available) {
                isUnique = true;
                break;
              }
            }
          } catch {
            // fallback if network issue
          }
          attempts++;
          uniqueUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const idToken = await getIdToken(credential.user);
        await fetch(`${API_BASE}/api/users/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: credential.user.uid,
            displayName: credential.user.displayName || uniqueUsername,
            username: uniqueUsername,
            email: credential.user.email,
            bio: "Member of Nishant Kumar community.",
            avatar: "boy",
            isActivated: true,
          }),
        });

        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        }
      } else {
        const data = userSnap.data();
        setProfile({ id: userSnap.id, uid: data.uid ?? userSnap.id, ...data } as UserProfile);

        // FIX #4: Await profile activation so isActivated is reliably set before redirect
        try {
          const existingIdToken = await getIdToken(credential.user);
          const activateRes = await fetch(`${API_BASE}/api/users/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${existingIdToken}`,
            },
            body: JSON.stringify({
              uid: credential.user.uid,
              email: credential.user.email,
              isActivated: true,
            }),
          });
          if (!activateRes.ok) {
            console.warn("Profile activation sync failed:", activateRes.status);
          }
        } catch (err) {
          console.warn("Profile activation sync error:", err);
        }
      }

      setAuthUser(credential.user);
      router.replace(redirectTarget);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code === "auth/popup-closed-by-user") {
        setNotice({ text: "Google Sign-In popup was closed.", type: "info" });
      } else {
        setNotice({ text: err?.message || "Google Sign-In failed. Please try again.", type: "error" });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConfigured || !auth || !db) {
      setNotice({ text: "Firebase is not configured yet.", type: "error" });
      return;
    }

    const email = authForm.email.trim();
    const password = authForm.password.trim();
    const username = authForm.username.trim().toLowerCase();

    if (!email || !password) {
      setNotice({ text: "Please enter your email and password.", type: "error" });
      return;
    }

    if (authMode === "signup") {
      if (!authForm.displayName.trim()) {
        setNotice({ text: "Please enter your full display name.", type: "error" });
        return;
      }
      if (!username || username.length < 3) {
        setNotice({ text: "Username must be at least 3 characters.", type: "error" });
        return;
      }

      // FIX #1: Lock the form immediately before any async work to prevent double-submit race
      setAuthLoading(true);
      setNotice(null);

      try {
        // Check username uniqueness securely via backend API (bypasses unauthenticated Firestore rule restrictions)
        try {
          const checkRes = await fetch(`${API_BASE}/api/users/check-username?username=${encodeURIComponent(username)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.available === false) {
              setNotice({ text: "That username is already taken. Please choose another.", type: "error" });
              setAuthLoading(false);
              return;
            }
          } else {
            const errData = await checkRes.json().catch(() => ({})) as { error?: string };
            if (checkRes.status === 400 && errData?.error) {
              setNotice({ text: errData.error, type: "error" });
              setAuthLoading(false);
              return;
            }
          }
        } catch (checkErr) {
          console.warn("Username availability check network warning:", checkErr);
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(credential.user);

        window.localStorage.setItem(pendingSignupStorageKey, JSON.stringify({
          uid: credential.user.uid,
          displayName: authForm.displayName.trim(),
          username,
          bio: authForm.bio.trim() || "Member of Nishant Kumar community.",
          avatar: authForm.avatar,
        } satisfies PendingSignupProfile));
        setAuthUser(credential.user);

        setNotice({
          text: "Verification link sent. Please check your inbox and verify your email to finish creating your account.",
          type: "info",
        });
        setAuthForm(emptyAuthForm);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (err?.code === "auth/email-already-in-use") {
          setNotice({ text: "This email address is already in use. Please log in.", type: "error" });
        } else if (err?.code === "auth/weak-password") {
          setNotice({ text: "Password should be at least 6 characters.", type: "error" });
        } else {
          setNotice({ text: err?.message || "Signup failed. Please try again.", type: "error" });
        }
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // Login mode
    setAuthLoading(true);
    setNotice(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      if (!credential.user.emailVerified) {
        await signOut(auth);
        setAuthUser(null);
        setProfile(null);
        setNotice({
          text: "Please check your inbox and click the verification link to activate full NSGram, Quiz & Gallery access before logging in.",
          type: "error",
        });
        setAuthLoading(false);
        return;
      }

      try {
        const idToken = await getIdToken(credential.user);
        await fetch(`${API_BASE}/api/users/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: credential.user.uid,
            email: credential.user.email,
            isActivated: true,
          }),
        });
      } catch (err) {
        console.warn("Profile activation sync warning:", err);
      }

      setAuthUser(credential.user);
      router.replace(redirectTarget);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password") {
        setNotice({ text: "Invalid email or password. Please try again.", type: "error" });
      } else if (err?.code === "auth/too-many-requests") {
        setNotice({ text: "Too many failed attempts. Please reset your password or try later.", type: "error" });
      } else {
        setNotice({ text: err?.message || "Login failed. Please check your credentials.", type: "error" });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-12 py-10 lg:py-16 noise">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-[140px] pointer-events-none -z-10" />

      <div className="w-full max-w-[1140px] relative z-10">
        {/* Main Card Container styled exactly like Profound Impact layout */}
        <div className="w-full bg-zinc-950/90 border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.6)] rounded-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-xl">
          <div className="flex justify-center items-center flex-col md:flex-row h-full">
            
            {/* ─── LEFT COLUMN: Profound Impact Style auth_image.svg Illustration ─── */}
            <div className="w-full md:w-1/2 md:px-6 lg:px-10 pb-6 md:pb-8 mb-6 md:mb-0 flex justify-center items-center">
              <div className="w-full max-w-[450px] flex justify-center items-center">
                <Image
                  src="/auth_image.svg"
                  alt="Authentication illustration"
                  width={450}
                  height={450}
                  priority
                  className="w-full max-w-[450px] h-auto object-contain select-none pointer-events-none"
                />
              </div>
            </div>

            {/* ─── RIGHT COLUMN: Auth Form (Exact Profound Impact Layout) ─── */}
            <div className="w-full md:w-1/2 md:px-6 lg:px-10 flex justify-center items-center">
              <div className="w-full max-w-[450px] lg:py-4">
                
                {/* Header Title & Switcher */}
                <div className="mb-6 lg:mb-8">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {forgotPassword ? "Reset Password" : authMode === "login" ? "Log In" : "Sign Up"}
                  </h1>

                  {!forgotPassword && (
                    <p className="text-sm text-brand-300 font-medium mt-2">
                      {authMode === "login" ? (
                        <>
                          Don&apos;t have an account?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("signup");
                              setNotice(null);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Sign Up
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("login");
                              setNotice(null);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Log In
                          </button>
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Notice / Alert Banner */}
                {notice && (
                  <div
                    className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in ${
                      notice.type === "error"
                        ? "bg-red-500/15 border border-red-500/30 text-red-300"
                        : notice.type === "success"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <span className="text-sm shrink-0">
                      {notice.type === "error" ? "⚠️" : notice.type === "success" ? "✅" : "ℹ️"}
                    </span>
                    <span className="leading-relaxed flex-1">{notice.text}</span>
                  </div>
                )}

                {/* Email Verification Banner if user is logged in but unverified */}
                {authUser && !authUser.emailVerified && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 space-y-3">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>📩</span>
                      <span>Verification Required for {authUser.email}</span>
                    </p>
                    <p className="text-brand-300 text-[11px]">
                      Please check your inbox and click the verification link to activate full NSGram, Quiz & Gallery access.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleManualVerificationCheck}
                        disabled={authLoading}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors"
                      >
                        I Verified My Email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={authLoading}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] border border-white/10 transition-colors"
                      >
                        Resend Link
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-3 py-1.5 text-brand-400 hover:text-white text-[11px] transition-colors ml-auto"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── FORGOT PASSWORD FORM ─── */}
                {forgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-brand-200">Email Address</label>
                        {authUser?.email && (
                          <span className="text-[11px] text-brand-400">Account email</span>
                        )}
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                      <p className="text-[11px] text-brand-400">
                        Enter the email address registered to your account.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                      >
                        {authLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPassword(false);
                          setNotice(null);
                        }}
                        className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-300 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ─── MAIN LOGIN / SIGNUP FORM ─── */
                  <form onSubmit={handleAuthSubmit} className="space-y-5">
                    {/* Sign Up Fields: Display Name & Username */}
                    {authMode === "signup" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-brand-200">Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Nishant Kumar"
                              value={authForm.displayName}
                              onChange={(e) => setAuthForm({ ...authForm, displayName: e.target.value })}
                              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-brand-200">Username</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. hiiinishant"
                              value={authForm.username}
                              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-mono"
                            />
                          </div>
                        </div>

                        {/* Avatar Selection */}
                        <div className="space-y-2 pt-1">
                          <label className="block text-sm font-medium text-brand-200">Choose Avatar</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setAuthForm({ ...authForm, avatar: "boy" })}
                              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                authForm.avatar === "boy"
                                  ? "bg-amber-500/20 border-amber-500/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                  : "bg-white/5 border-white/10 text-brand-400 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-xl">👦</span>
                              <span className="text-xs font-semibold">Boy Avatar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAuthForm({ ...authForm, avatar: "girl" })}
                              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                authForm.avatar === "girl"
                                  ? "bg-amber-500/20 border-amber-500/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                  : "bg-white/5 border-white/10 text-brand-400 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-xl">👧</span>
                              <span className="text-xs font-semibold">Girl Avatar</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-brand-200">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="Email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-brand-200">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-brand-400 hover:text-white transition-colors"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>

                    {/* FIX #3: Remember Me only shown in login mode (no effect during signup) */}
                    <div className="flex items-center justify-between text-sm pt-1">
                      {authMode === "login" ? (
                        <label className="flex items-center gap-2 cursor-pointer select-none text-brand-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={authForm.rememberMe}
                            onChange={(e) => setAuthForm({ ...authForm, rememberMe: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                          />
                          <span>Remember me</span>
                        </label>
                      ) : (
                        <span />
                      )}

                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPassword(true);
                            setResetEmail(authUser?.email ?? "");
                            setNotice(null);
                          }}
                          className="text-brand-300 hover:text-amber-400 transition-colors underline underline-offset-2"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] hover:-translate-y-0.5 disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{authLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Sign Up"}</span>
                    </button>

                    {/* OR Divider */}
                    <div className="flex items-center my-6 before:flex-1 before:border-t before:border-white/10 after:flex-1 after:border-t after:border-white/10">
                      <p className="text-[13px] text-brand-500 text-center font-medium mx-3 mb-0">OR</p>
                    </div>

                    {/* Google Sign In Button (Profound Impact style) */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
