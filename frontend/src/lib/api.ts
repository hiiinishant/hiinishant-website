/**
 * Returns the base URL for all API calls.
 * In production (Vercel), this reads from NEXT_PUBLIC_BACKEND_URL.
 * In development, falls back to empty string (relative path).
 */
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
