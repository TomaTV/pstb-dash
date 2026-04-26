import { NextResponse } from "next/server";
import { getUsers } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return NextResponse.json({ error: "Email et code PIN requis." }, { status: 400 });
    }

    const emailFormatted = email.trim().toLowerCase();
    const users = getUsers();
    const user = users[emailFormatted];

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    if (user.pin !== pin) {
      return NextResponse.json({ error: "Code PIN incorrect." }, { status: 403 });
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "pstb_student_email",
      value: emailFormatted,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });

    return NextResponse.json({ success: true, user: { firstName: user.firstName, lastName: user.lastName, email: user.email } });
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
