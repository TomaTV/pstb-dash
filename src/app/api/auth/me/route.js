import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } 
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Erreur serveur." }, { status: 500 });
  }
}
