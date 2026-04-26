import { NextResponse } from "next/server";
import crypto from "crypto";

// Session tokens stored in memory (server-side only)
// In production you'd use Redis or the DB, but for a single-instance dashboard this is fine
if (!globalThis.__adminSessions) {
  globalThis.__adminSessions = new Map();
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req) {
  try {
    const { password } = await req.json();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PST&B-41@Chanzy";

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h

    globalThis.__adminSessions.set(token, { expiresAt });

    // Cleanup expired sessions
    for (const [t, s] of globalThis.__adminSessions) {
      if (s.expiresAt < Date.now()) globalThis.__adminSessions.delete(t);
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("pstb_admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
