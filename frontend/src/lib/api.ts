/**
 * Returns the base URL for all API calls.
 * In production, this should be configured via NEXT_PUBLIC_BACKEND_URL.
 * In development, localhost requests fall back to the local backend.
 */
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || (isLocalhost ? "http://localhost:5000" : "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
