import { NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { password } = await req.json();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PST&B-41@Chanzy";

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const token = await createAdminSessionToken();

    const res = NextResponse.json({ ok: true });
    res.cookies.set("pstb_admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
