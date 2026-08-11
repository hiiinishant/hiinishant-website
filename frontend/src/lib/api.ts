export const LIVE_BACKEND_URL = "https://hiiinishant-backend.onrender.com";

const isLocalhost =
  typeof window !== "undefined"
    ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    : process.env.NODE_ENV !== "production";

export const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || (isLocalhost ? "http://localhost:5000" : LIVE_BACKEND_URL);

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
