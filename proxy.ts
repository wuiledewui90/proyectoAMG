import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE_NAME, readAdminSessionToken } from "@/lib/admin-session"

export async function proxy(req: NextRequest) {
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
    const session = await readAdminSessionToken(cookie)

    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    if (
      session.role === "TECHNICIAN" &&
      pathname !== "/admin/mis-tareas" &&
      !pathname.startsWith("/admin/mis-tareas/")
    ) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/mis-tareas"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
