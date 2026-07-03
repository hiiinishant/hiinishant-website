import crypto from "crypto";
import { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "default-secret-key-12345";

export function generateToken(): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = expiry.toString();
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function verifyToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expiry = parseInt(payload, 10);
    if (expiry < Date.now()) return false;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
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
