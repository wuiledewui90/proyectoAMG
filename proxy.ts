import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE_NAME, readAdminSessionToken } from "@/lib/admin-session"
import { isTrustedMutationOrigin } from "@/lib/security/request"

function contentSecurityPolicy() {
  const scripts = process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'"

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scripts}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    process.env.NODE_ENV === "production"
      ? "connect-src 'self'"
      : "connect-src 'self' ws: wss:",
    "media-src 'self'",
    "frame-src 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ")
}

function secureResponse(response: NextResponse, pathname: string) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy())
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    response.headers.set("Cache-Control", "no-store")
  }

  return response
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") === "http" &&
    process.env.APP_URL
  ) {
    const target = new URL(req.nextUrl.pathname + req.nextUrl.search, process.env.APP_URL)
    return secureResponse(NextResponse.redirect(target, 308), pathname)
  }

  if (pathname.startsWith("/api/") && !isTrustedMutationOrigin(req)) {
    return secureResponse(
      NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 }),
      pathname
    )
  }

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return secureResponse(NextResponse.next(), pathname)
  }

  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
    const session = await readAdminSessionToken(cookie)

    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      return secureResponse(NextResponse.redirect(url), pathname)
    }

    if (
      session.role === "TECHNICIAN" &&
      pathname !== "/admin/mis-tareas" &&
      !pathname.startsWith("/admin/mis-tareas/")
    ) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/mis-tareas"
      return secureResponse(NextResponse.redirect(url), pathname)
    }
  }

  return secureResponse(NextResponse.next(), pathname)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webmanifest)$).*)",
  ],
}
