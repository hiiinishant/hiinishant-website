import { Suspense } from "react";
import LoginClientPage from "./LoginClientPage";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — Nishant Kumar",
  description: "Log in or create an account to access NSGram Community, Daily Live Quiz, and exclusive updates.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginClientPage />
    </Suspense>
  );
}
