"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot, getDocs, query, collection, where, getDoc } from "firebase/firestore";
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
  isActivated?: boolean;
};

const emptyAuthForm = {
  email: "",
  password: "",
  displayName: "",
  username: "",
  bio: "",
  avatar: "boy" as AvatarType,
};

export default function NsgramApp() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const router = useRouter();

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

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  // Redirect to home if logged in successfully
  useEffect(() => {
    if (!loading && authUser && authUser.emailVerified && profile?.isActivated) {
      router.replace("/nsgram/home");
    }
  }, [authUser, profile, loading, router]);

  // Silent background verification check (no loading spinner, no notice update)
  const autoCheckVerification = async () => {
    if (!authUser || authUser.emailVerified || !auth || !db) return;
    try {
      await reload(authUser);
      const currentUser = auth.currentUser;
      if (currentUser?.emailVerified) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        await fetch(`${backendUrl}/api/users/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            isActivated: true,
          }),
        });
        setAuthUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        }
        router.replace("/nsgram/home");
      }
    } catch {
      // Silent — do not interrupt the user or show an error
    }
  };

  // Auto-check when user returns to this tab after verifying email in another tab
  useEffect(() => {
    const handleFocus = () => {
      if (authUser && !authUser.emailVerified) {
        autoCheckVerification();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authUser]);

  const handleResendVerification = async () => {
    if (!authUser) return;
    setAuthLoading(true);
    setNotice("");
    try {
      await sendEmailVerification(authUser);
      setNotice("Verification email resent successfully. Please check your inbox and spam folder.");
    } catch (error: any) {
      console.warn("Resend verification error:", error);
      setNotice(error?.message || "Failed to resend verification email. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!authUser) return;
    setAuthLoading(true);
    setNotice("");
    try {
      await reload(authUser);
      const currentUser = auth.currentUser;
      if (currentUser?.emailVerified) {
        // Activate profile on backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        await fetch(`${backendUrl}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            isActivated: true,
          }),
        });

        // Set states so redirect triggers
        setAuthUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        }

        setNotice("Email verified successfully! Loading workspace...");
        router.replace("/nsgram/home");
      } else {
        setNotice("Email is still not verified. Please check your inbox and spam folder.");
      }
    } catch (error: any) {
      console.warn("Check verification error:", error);
      setNotice(error?.message || "Verification check failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setNotice("");
    try {
      await signOut(auth);
      setAuthUser(null);
      setProfile(null);
    } catch (error: any) {
      console.warn("Sign out error:", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!isConfigured || !auth) {
      setNotice("Firebase is not configured yet.");
      return;
    }
    const email = resetEmail.trim();
    if (!email) {
      setNotice("Please enter your email address.");
      return;
    }
    setAuthLoading(true);
    setNotice("");
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice("Password reset link sent! Check your inbox and spam folder.");
      setResetEmail("");
    } catch (error: any) {
      console.warn("Password reset error:", error);
      if (error?.code === "auth/user-not-found" || error?.code === "auth/invalid-email") {
        setNotice("No account found with that email address.");
      } else if (error?.code === "auth/too-many-requests") {
        setNotice("Too many requests. Please wait a moment and try again.");
      } else {
        setNotice(error?.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured || !auth || !db) {
      setNotice("Firebase is not configured yet. Add your Firebase environment variables to enable sign-in.");
      return;
    }

    setAuthLoading(true);
    setNotice("");
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      // Check if user has an existing Firestore profile
      const userRef = doc(db, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      if (!userSnap.exists()) {
        // Generate unique username
        let baseUsername = credential.user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") 
                        || credential.user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, "") 
                        || "user";

        if (baseUsername.length < 3) baseUsername = baseUsername + "123";

        let uniqueUsername = baseUsername;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          const usernameCheck = await getDocs(query(collection(db, "users"), where("username", "==", uniqueUsername)));
          if (usernameCheck.empty) {
            isUnique = true;
          } else {
            attempts++;
            uniqueUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
          }
        }

        // Create profile on backend with isActivated: true (Google is pre-verified)
        await fetch(`${backendUrl}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: credential.user.uid,
            displayName: credential.user.displayName || uniqueUsername,
            username: uniqueUsername,
            email: credential.user.email,
            bio: "Connected via Google Sign-In.",
            avatar: "boy",
            isActivated: true,
          }),
        });

        // Fetch the newly created profile so state is populated
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        }
      } else {
        // User already exists — update lastLoginAt asynchronously so redirect is instant
        const data = userSnap.data();
        setProfile({ id: userSnap.id, uid: data.uid ?? userSnap.id, ...data } as UserProfile);

        // Fire-and-forget background update (does not block redirect)
        fetch(`${backendUrl}/api/users/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: credential.user.uid,
            email: credential.user.email,
            isActivated: true,
          }),
        }).catch((err) => console.warn("Background profile update failed:", err));
      }

      setAuthUser(credential.user);
      setNotice("Signed in successfully with Google.");
      router.replace("/nsgram/home");
    } catch (error: any) {
      console.warn("Google Sign-In error:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        setNotice("Google Sign-In popup was closed before completing authentication.");
      } else if (error?.code === "auth/popup-blocked") {
        setNotice("Google Sign-In popup was blocked by your browser. Please allow popups for this site.");
      } else if (error?.code === "auth/cancelled-popup-request") {
        setNotice("Sign-in request was cancelled. Please try again.");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        setNotice("An account already exists with this email address but using a different sign-in method.");
      } else {
        setNotice(error?.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

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

        // Immediately send verification email
        await sendEmailVerification(credential.user);

        // Create user profile via backend API (role defaults to 'user', isActivated defaults to false)
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
            isActivated: false,
          }),
        });

        setNotice("Account created successfully. A verification link has been sent to your email. Please check your inbox and spam folder.");
        setAuthForm(emptyAuthForm);
      } catch (error: any) {
        console.warn("Signup error:", error);
        if (error?.code === "auth/weak-password") {
          setNotice("Password should be at least 6 characters.");
        } else if (error?.code === "auth/email-already-in-use") {
          setNotice("This email address is already in use.");
        } else if (error?.code === "auth/invalid-email") {
          setNotice("Please enter a valid email address.");
        } else {
          setNotice(error?.message || "Signup failed. Please try again.");
        }
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    setAuthLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!credential.user.emailVerified) {
        setNotice("Please verify your email before logging in. Check your inbox and spam folder.");
        setAuthLoading(false);
        return;
      }

      // Update lastLoginAt and activate profile via backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      fetch(`${backendUrl}/api/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: credential.user.uid,
          email: credential.user.email,
          isActivated: true,
        }),
      }).catch(err => console.warn('Failed to update lastLoginAt:', err));

      setNotice("Signed in successfully.");
    } catch (error: any) {
      console.warn("Signin error:", error);
      if (error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        setNotice("Invalid email or password.");
      } else if (error?.code === "auth/too-many-requests") {
        setNotice("Access disabled temporarily due to too many failed attempts. Try again later.");
      } else {
        setNotice(error?.message || "Invalid email or password.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-brand-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm tracking-wide">
            Loading your community workspace…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_50%)] px-4 py-16 text-foreground flex items-center justify-center">
      <div className="mx-auto flex max-w-6xl w-full flex-col gap-10 lg:flex-row lg:items-center">
        {/* Left welcome text details */}
        <div className="flex-1 max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/70 p-8 xl:p-10 shadow-2xl backdrop-blur">
          <p className="mb-4 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
            Nsgram Workspace
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            A private community for <span className="text-gradient font-black">real conversations.</span>
          </h1>
          <p className="mt-4 text-base text-brand-300 sm:text-lg leading-relaxed">
            Create an account, edit your profile avatar, search other members, and connect instantly with real-time direct chats.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setAuthMode("signup")}
              className={`rounded-2xl px-6 py-3 font-bold text-sm transition duration-300 ${
                authMode === "signup"
                  ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                  : "border border-white/10 text-white hover:bg-white/10"
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setAuthMode("login")}
              className={`rounded-2xl px-6 py-3 font-bold text-sm transition duration-300 ${
                authMode === "login"
                  ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                  : "border border-white/10 text-white hover:bg-white/10"
              }`}
            >
              Log in
            </button>
          </div>
        </div>

        {/* Right authentication form */}
        <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-950/75 p-6 sm:p-8 shadow-2xl backdrop-blur">
          {forgotPassword ? (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  Reset Password
                </h2>
                <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                  Firebase Auth
                </span>
              </div>

              <div className="space-y-5">
                <p className="text-sm text-brand-300 leading-relaxed">
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>

                <form className="space-y-4" onSubmit={handleForgotPassword}>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                    placeholder="Email address"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                  />
                  <button
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                  >
                    {authLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setForgotPassword(false); setNotice(""); setResetEmail(""); }}
                  className="w-full rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-brand-300 hover:text-white font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          ) : authUser && !authUser.emailVerified ? (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  Verify Your Email
                </h2>
                <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                  Firebase Auth
                </span>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-brand-300 leading-relaxed">
                  We've sent a verification link to <strong className="text-white">{authUser.email}</strong>.
                </p>
                <p className="text-sm text-brand-300 leading-relaxed font-semibold text-amber-300">
                  Please verify your email before logging in. Check your inbox and spam folder.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                  >
                    {authLoading ? "Sending..." : "Resend Verification Email"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={authLoading}
                    className="w-full rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                  >
                    {authLoading ? "Checking..." : "I've Verified My Email"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className="w-full rounded-2xl border border-red-500/30 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-200 font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                  >
                    Back to Login / Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {authMode === "login" ? "Welcome back" : "Create Community Account"}
                </h2>
                <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                  Firebase Auth
                </span>
              </div>

              <form className="space-y-4" onSubmit={handleAuth}>
                {authMode === "signup" && (
                  <>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                      placeholder="Display name"
                      required
                      value={authForm.displayName}
                      onChange={(event) =>
                        setAuthForm((prev) => ({ ...prev, displayName: event.target.value }))
                      }
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                      placeholder="Username"
                      required
                      value={authForm.username}
                      onChange={(event) =>
                        setAuthForm((prev) => ({
                          ...prev,
                          username: event.target.value.toLowerCase(),
                        }))
                      }
                    />
                    <textarea
                      className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                      placeholder="Tell us a bit about yourself..."
                      value={authForm.bio}
                      onChange={(event) =>
                        setAuthForm((prev) => ({ ...prev, bio: event.target.value }))
                      }
                    />
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-brand-400 uppercase tracking-wider">
                        Choose Avatar type
                      </label>
                      <div className="flex gap-3">
                        {(["boy", "girl"] as AvatarType[]).map((avatar) => (
                          <button
                            key={avatar}
                            type="button"
                            onClick={() => setAuthForm((prev) => ({ ...prev, avatar }))}
                            className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                              authForm.avatar === avatar
                                ? "border-amber-400 bg-amber-400/20 text-amber-200"
                                : "border-white/10 bg-white/5 text-brand-300 hover:border-white/20"
                            }`}
                          >
                            {avatar === "boy" ? "👦 Boy" : "👧 Girl"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                  placeholder="Email address"
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400 text-white text-sm transition"
                  placeholder="Password"
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />

                {authMode === "login" && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); setNotice(""); }}
                      className="text-xs text-brand-400 hover:text-amber-300 font-semibold transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                
                <button
                  disabled={authLoading}
                  className="w-full rounded-2xl bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
                >
                  {authLoading ? "Authenticating..." : authMode === "login" ? "Login" : "Register Profile"}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-white/10 w-full"></div>
                <span className="absolute bg-slate-950 px-3 text-xs text-brand-400 font-bold uppercase tracking-wider">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-bold py-3 text-sm flex items-center justify-center gap-3 transition duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {notice && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-brand-300 transition duration-300 animate-fadeIn">
              {notice}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
