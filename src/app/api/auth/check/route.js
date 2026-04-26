import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get("pstb_admin_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = globalThis.__adminSessions?.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true });
  } catch (e) {
    return NextResponse.json({ authenticated: false });
  }
}
