import crypto from "crypto";
import { Request } from "express";

// SECURITY: Use a dedicated JWT_SECRET env var for token signing.
// This must be separate from ADMIN_PASSWORD so a leaked token doesn't reveal the login password.
// If JWT_SECRET is not set, warn loudly — the server still works but tokens are less secure.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    '[Auth] WARNING: JWT_SECRET environment variable is not set. ' +
    'Set a strong, random JWT_SECRET in your .env.local for production security.'
  );
}
const EFFECTIVE_SECRET = JWT_SECRET || crypto.randomBytes(32).toString('hex');

export function generateToken(): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = expiry.toString();
  const signature = crypto.createHmac("sha256", EFFECTIVE_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function verifyToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expiry = parseInt(payload, 10);
    if (expiry < Date.now()) return false;
    const expectedSignature = crypto.createHmac("sha256", EFFECTIVE_SECRET).update(payload).digest("hex");
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

export function extractToken(req: Request): string {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  let token = "";
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }
  return token;
}

export function isAuthenticated(req: Request): boolean {
  const token = extractToken(req);
  return token ? verifyToken(token) : false;
}
