"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNsgram = pathname?.startsWith("/nsgram");

  // Detect browser Back / Forward button presses
  const isPopState = useRef(false);

  useLayoutEffect(() => {
    const handlePopState = () => {
      isPopState.current = true;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    // Skip scroll-to-top on Back/Forward browser navigation so the browser
    // can restore the previous scroll position naturally.
    // On forward navigation (card click), scroll to top instantly AFTER the
    // new page has rendered but BEFORE the browser paints the first frame —
    // this prevents both the banner flash AND the visible smooth-scroll animation
    // caused by `scroll-behavior: smooth` in globals.css.
    if (!isPopState.current && !window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    isPopState.current = false; // reset for next navigation
  }, [pathname]);

  return (
    <main className={`flex-grow ${isNsgram ? "" : "pt-16 lg:pt-20"}`}>
      {children}
    </main>
  );
}
