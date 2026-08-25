"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global component that suppresses the browser's native bottom-left URL status preview
 * when hovering over any button, card, or link across the entire website.
 */
export default function LinkPreviewHider() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Track elements that currently have their href hidden
    const hiddenLinks = new WeakSet<HTMLAnchorElement>();

    const hideHref = (link: HTMLAnchorElement) => {
      const href = link.getAttribute("href");
      if (href && href !== "" && !link.hasAttribute("data-no-hide")) {
        link.setAttribute("data-raw-href", href);
        link.removeAttribute("href");
        link.style.cursor = "pointer";
        hiddenLinks.add(link);
      }
    };

    const restoreHref = (link: HTMLAnchorElement) => {
      const rawHref = link.getAttribute("data-raw-href");
      if (rawHref) {
        link.setAttribute("href", rawHref);
        link.removeAttribute("data-raw-href");
        hiddenLinks.delete(link);
      }
    };

    // 1. On mouseover: remove href to prevent the browser status bar tooltip
    const handleMouseOver = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (link && link.hasAttribute("href")) {
        hideHref(link);
      }
    };

    // 2. On mouseout: restore href so DOM remains clean
    const handleMouseOut = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (link && link.hasAttribute("data-raw-href")) {
        restoreHref(link);
      }
    };

    // 3. On right-click context menu: restore href so "Copy link address" and "Open in new tab" work
    const handleContextMenu = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (link && link.hasAttribute("data-raw-href")) {
        restoreHref(link);
      }
    };

    // 4. On click: navigate accurately whether internal or external
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!link) return;

      const rawHref = link.getAttribute("data-raw-href") || link.getAttribute("href");
      if (!rawHref) return;

      // Handle external links or explicit target="_blank"
      const target = link.getAttribute("target");
      const isExternal =
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("//") ||
        target === "_blank";

      const isMiddleClick = e.button === 1;
      const isSpecialClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

      if (isMiddleClick || isSpecialClick || isExternal) {
        if (target === "_blank" || isMiddleClick || isSpecialClick) {
          e.preventDefault();
          window.open(rawHref, "_blank", "noopener,noreferrer");
          return;
        }
        // Normal external navigation
        e.preventDefault();
        window.location.href = rawHref;
        return;
      }

      // Hash links (e.g. #hero)
      if (rawHref.startsWith("#")) {
        e.preventDefault();
        const element = document.querySelector(rawHref);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.hash = rawHref;
        }
        return;
      }

      // Protocols like mailto:, tel:
      if (rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      // Internal routing with Next.js router
      if (rawHref.startsWith("/")) {
        e.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        router.push(rawHref, { scroll: true });
      }
    };

    // 5. On keyboard focus (accessibility)
    const handleFocusIn = (e: FocusEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (link && link.hasAttribute("href")) {
        hideHref(link);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (link && link.hasAttribute("data-raw-href")) {
        restoreHref(link);
      }
    };

    // 6. On keyboard keydown: handle Enter or Space
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        const link = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
        if (link && link.hasAttribute("data-raw-href")) {
          const rawHref = link.getAttribute("data-raw-href");
          if (rawHref) {
            e.preventDefault();
            if (rawHref.startsWith("http") || link.getAttribute("target") === "_blank") {
              window.open(rawHref, "_blank", "noopener,noreferrer");
            } else {
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              router.push(rawHref, { scroll: true });
            }
          }
        }
      }
    };

    document.addEventListener("mouseover", handleMouseOver, { capture: true, passive: true });
    document.addEventListener("mouseout", handleMouseOut, { capture: true, passive: true });
    document.addEventListener("contextmenu", handleContextMenu, { capture: true, passive: true });
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("focusin", handleFocusIn, { capture: true, passive: true });
    document.addEventListener("focusout", handleFocusOut, { capture: true, passive: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, { capture: true });
      document.removeEventListener("mouseout", handleMouseOut, { capture: true });
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("focusin", handleFocusIn, { capture: true });
      document.removeEventListener("focusout", handleFocusOut, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [router]);

  return null;
}
