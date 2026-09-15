"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNsgram = pathname?.startsWith("/nsgram");

  // ─── Scroll behaviour notes ───────────────────────────────────────────────
  // Next.js App Router + <Link prefetch> + router.push({ scroll: true })
  // already scroll the page to the top on every forward navigation.
  // The browser's native scroll-restoration handles the back/forward cache,
  // so pressing Back correctly returns the user to their previous scroll position.
  //
  // We deliberately do NOT call window.scrollTo here because:
  //  1. It caused a "homepage banner flash" — the homepage scrolled to the top
  //     while the new page was still loading, briefly showing the hero/banner.
  //  2. It broke the back button — every time the user pressed Back, the page
  //     was forced to the very top instead of restoring their previous position.
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className={`flex-grow ${isNsgram ? "" : "pt-16 lg:pt-20"}`}>
      {children}
    </main>
  );
}
