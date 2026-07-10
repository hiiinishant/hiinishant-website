"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { NsgramAuthProvider, useNsgramAuth } from "@/components/nsgram/NsgramAuthProvider";
import NsgramSidebar from "@/components/nsgram/NsgramSidebar";
import NsgramHeader from "@/components/nsgram/NsgramHeader";

function NsgramLayoutContent({ children }: { children: React.ReactNode }) {
  const { authUser, profile, loading } = useNsgramAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not loading, and there's no active verified user or activated profile, and we are not on the login/signup index page (/nsgram)
    const isVerified = authUser && authUser.emailVerified;
    const isProfileActivated = profile && profile.isActivated;
    if (!loading && (!authUser || !isVerified || !profile || !isProfileActivated) && pathname !== "/nsgram") {
      router.replace("/nsgram");
    }
  }, [authUser, profile, loading, pathname, router]);

  // If loading, show community loading spinner
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

  // If not logged in and not loading, we redirect (but show empty section while redirecting)
  // If we are on `/nsgram`, we don't show the layout sidebar/padding (since that's the login screen)
  if (pathname === "/nsgram") {
    return <>{children}</>;
  }

  const isVerified = authUser && authUser.emailVerified;
  const isProfileActivated = profile && profile.isActivated;

  if (!authUser || !isVerified || !profile || !isProfileActivated) {
    return <section className="min-h-screen bg-slate-950" />;
  }

  const isMessagesPage = pathname === "/nsgram/messages";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <NsgramSidebar />

      {/* Fixed top header — only shows on homepage */}
      {pathname === "/nsgram/home" && <NsgramHeader />}

      {/* Main Content Area */}
      <main className={`flex-1 md:pl-64 ${pathname === "/nsgram/home" ? "pt-14" : "pt-0"} ${isMessagesPage ? "pb-16 md:pb-0" : "pb-20 md:pb-0"} min-h-screen transition-all duration-300`}>
        <div className={isMessagesPage ? "w-full h-full" : "max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function NsgramLayout({ children }: { children: React.ReactNode }) {
  return (
    <NsgramAuthProvider>
      <NsgramLayoutContent>{children}</NsgramLayoutContent>
    </NsgramAuthProvider>
  );
}
