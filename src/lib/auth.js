const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function encodeBase64(binary) {
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(binary, "binary").toString("base64");
}

function decodeBase64(base64) {
  if (typeof atob === "function") return atob(base64);
  return Buffer.from(base64, "base64").toString("binary");
}

function toBase64Url(input) {
  return encodeBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeBase64(base64 + padding);
}

function utf8ToBinary(input) {
  return String.fromCharCode(...new TextEncoder().encode(input));
}

function binaryToUtf8(input) {
  const bytes = Uint8Array.from(input, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getSigningKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "pstb-dev-secret";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(value) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const binarySig = String.fromCharCode(...new Uint8Array(signature));
  return toBase64Url(binarySig);
}

export async function createAdminSessionToken() {
  const payload = {
    exp: Date.now() + TOKEN_TTL_MS,
    iat: Date.now(),
    jti: crypto.randomUUID(),
  };

  const encodedPayload = toBase64Url(utf8ToBinary(JSON.stringify(payload)));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  const expectedSignature = await signValue(payloadPart);
  if (signaturePart !== expectedSignature) return false;

  try {
    const payloadJson = binaryToUtf8(fromBase64Url(payloadPart));
    const payload = JSON.parse(payloadJson);
    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ============================================
// STUDENT AUTH LOGIC
// ============================================
import { getStore, setStore } from "@/lib/db";
import { cookies } from "next/headers";

export async function getUsers() {
  return (await getStore("users")) || {};
}

export async function saveUser(email, data) {
  const users = await getUsers();
  users[email] = data;
  await setStore("users", users);
}

export async function getSession() {
  const cookieStore = await cookies();
  const email = cookieStore.get("pstb_student_email")?.value;
  if (!email) return null;
  const users = await getUsers();
  return users[email] || null;
}
