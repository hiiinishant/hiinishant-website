"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNsgramAuth } from "@/components/nsgram/NsgramAuthProvider";
import { getLoginUrlWithRedirect } from "@/lib/auth-redirect";

export default function NsgramApp() {
  const { authUser, profile, loading } = useNsgramAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isVerified = authUser && authUser.emailVerified;
    const isProfileActivated = profile && profile.isActivated;

    if (authUser && isVerified && isProfileActivated) {
      router.replace("/nsgram/home");
    } else {
      router.replace(getLoginUrlWithRedirect("/nsgram"));
    }
  }, [authUser, profile, loading, router]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-brand-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm tracking-wide">
          {authUser && authUser.emailVerified && profile?.isActivated
            ? "Opening NSGram workspace…"
            : "Redirecting to login…"}
        </p>
      </div>
    </section>
  );
}
