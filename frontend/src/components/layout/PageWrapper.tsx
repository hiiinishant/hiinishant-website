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

      // globals.css sets `scroll-behavior: smooth` on <html>, which makes the
      // browser's own scroll restoration animate visibly (slides from top down
      // to the card position). We temporarily override it to "auto" the instant
      // Back/Forward is pressed so the position restores in zero milliseconds,
      // then restore smooth scrolling after two animation frames (by which time
      // the browser has already snapped to the saved position).
      document.documentElement.style.scrollBehavior = "auto";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = "";
        });
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    // Forward navigation (card click): scroll new page to top instantly,
    // before the browser paints, bypassing smooth scroll CSS.
    // Back/Forward navigation: skip — browser restores position instantly
    // (smooth was already disabled by the popstate handler above).
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
