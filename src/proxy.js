import { NextResponse } from "next/server";

// Initialize session store if not already done
if (!globalThis.__adminSessions) {
  globalThis.__adminSessions = new Map();
}

export function proxy(req) {
  const url = req.nextUrl;

  // Protect /admin routes (but not /admin/login)
  if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
    const token = req.cookies.get("pstb_admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const session = globalThis.__adminSessions?.get(token);
    if (!session || session.expiresAt < Date.now()) {
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
