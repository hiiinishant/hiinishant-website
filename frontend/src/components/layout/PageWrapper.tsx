"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNsgram = pathname?.startsWith("/nsgram");

  // Reset scroll position to top whenever navigating between pages/routes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // If there's an anchor hash (e.g. #contact, #faq), let the browser or hash handler handle it
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Perform a follow-up check on next animation frame in case dynamic content/layout renders asynchronously
        const rafId = requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        });

        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [pathname]);

  return (
    <main className={`flex-grow ${isNsgram ? "" : "pt-16 lg:pt-20"}`}>
      {children}
    </main>
  );
}
