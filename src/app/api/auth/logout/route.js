import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("pstb_admin_token");
    return res;
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}
