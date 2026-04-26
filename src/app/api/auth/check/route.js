import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get("pstb_admin_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const isValid = await verifyAdminSessionToken(token);
    if (!isValid) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true });
  } catch (e) {
    return NextResponse.json({ authenticated: false });
  }
}
