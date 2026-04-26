import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/auth";

export async function proxy(req) {
  const url = req.nextUrl;

  // Protect /admin routes (but not /admin/login)
  if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
    const token = req.cookies.get("pstb_admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const isValid = await verifyAdminSessionToken(token);
    if (!isValid) {
      // Expired or invalid — clear cookie and redirect
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("pstb_admin_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
