import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
    const isValidSession = await verifyAdminSessionToken(cookie)

    if (!isValidSession) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
