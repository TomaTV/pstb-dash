import { NextResponse } from "next/server";
import { getUsers, saveUser } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { email, firstName, lastName } = await req.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const emailFormatted = email.trim().toLowerCase();
    
    // Optional: enforce @stu-pstb.fr or @pstb.fr
    if (!emailFormatted.endsWith("@stu-pstb.fr") && !emailFormatted.endsWith("@pstb.fr")) {
      return NextResponse.json({ error: "L'email doit être une adresse PST&B valide." }, { status: 400 });
    }

    const users = await getUsers();

    // If user already exists, they must use login
    if (users[emailFormatted]) {
      return NextResponse.json({ error: "Ce compte existe déjà. Veuillez utiliser votre code PIN pour vous connecter." }, { status: 403 });
    }

    // Generate 4 digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Save user
    await saveUser(emailFormatted, {
      email: emailFormatted,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pin: pin,
      createdAt: Date.now()
    });

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

    return NextResponse.json({ success: true, pin });
  } catch (error) {
    console.error("Auth register error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
