/**
 * Authentication redirect sanitization and validation utilities.
 * Protects against open redirect attacks and infinite redirect loops.
 */

/**
 * Validates and sanitizes a redirect target URL.
 * Only allows relative paths on the same origin (e.g. "/quiz", "/blog/my-post", "/nsgram/messages").
 * Disallows external URLs, protocol-relative paths (//example.com), and loops (/login, /signup).
 *
 * @param target - The redirect path candidate (e.g. from searchParams)
 * @param fallback - Safe default fallback path (defaults to "/")
 * @returns A safe relative path
 */
export function getSafeRedirect(
  target: string | null | undefined,
  fallback: string = "/"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must begin with a single slash (relative URL) and cannot start with //, /\, or \
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return fallback;
  }

  // Reject dangerous protocols or control characters
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:") ||
    lower.includes("\r") ||
    lower.includes("\n") ||
    lower.includes("\0")
  ) {
    return fallback;
  }

  try {
    // Parse using dummy base to ensure it remains strictly relative to the site
    const parsed = new URL(trimmed, "http://localhost");

    // Origin must stay http://localhost and pathname must start with /
    if (parsed.origin !== "http://localhost" || !parsed.pathname.startsWith("/")) {
      return fallback;
    }

    // Disallow redirecting directly to login or signup to prevent redirect loops
    if (
      parsed.pathname === "/login" ||
      parsed.pathname === "/signup" ||
      parsed.pathname.startsWith("/login/") ||
      parsed.pathname.startsWith("/signup/")
    ) {
      return fallback;
    }

    // Return the safe relative path (pathname + search + hash)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Generates the login URL with an encoded redirect parameter for the given path.
 *
 * @param currentPath - The current pathname or full relative URL
 * @returns The full login route URL (e.g. "/login?redirect=%2Fquiz")
 */
export function getLoginUrlWithRedirect(currentPath: string | null | undefined): string {
  const safePath = getSafeRedirect(currentPath, "");
  if (!safePath || safePath === "/") {
    return "/login";
  }
  return `/login?redirect=${encodeURIComponent(safePath)}`;
}
