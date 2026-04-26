import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const jar = await cookies();
    const token = jar.get("pstb_admin_token")?.value;

    if (token && globalThis.__adminSessions) {
      globalThis.__adminSessions.delete(token);
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete("pstb_admin_token");
    return res;
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}
