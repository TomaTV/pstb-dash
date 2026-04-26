import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("pstb_admin_token");
    res.cookies.delete("pstb_student_email");
    return res;
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}
