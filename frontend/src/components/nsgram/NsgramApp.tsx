"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot, getDocs, query, collection, where } from "firebase/firestore";
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
    if (!loading && authUser && profile) {
      router.replace("/nsgram/home");
    }
  }, [authUser, profile, loading, router]);

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

        setNotice("Account created successfully. Logging you in...");
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
            
            <button
              disabled={authLoading}
              className="w-full rounded-2xl bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold py-3 text-sm tracking-wide uppercase transition duration-300"
            >
              {authLoading ? "Authenticating..." : authMode === "login" ? "Login" : "Register Profile"}
            </button>
          </form>

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
