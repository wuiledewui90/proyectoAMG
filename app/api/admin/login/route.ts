import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  authenticateAdminCredentials,
  createAdminSessionToken,
  getAdminSessionMaxAge,
} from "@/lib/admin-session"
import { checkRateLimit, clearRateLimit } from "@/lib/security/rate-limit"
import { getRequestIp } from "@/lib/security/request"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }
  const normalizedUsername = typeof username === "string" ? username.trim().slice(0, 80) : ""
  const suppliedPassword = typeof password === "string" ? password.slice(0, 129) : ""
  const limitKey = `admin-login:${getRequestIp(req)}:${normalizedUsername.toLowerCase() || "unknown"}`
  const rateLimit = checkRateLimit(limitKey, { limit: 5, windowMs: 15 * 60 * 1000 })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Esperá unos minutos antes de volver a intentar." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" },
      }
    )
  }

  const principal = await authenticateAdminCredentials(normalizedUsername, suppliedPassword)
  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "Usuario o contraseña incorrectos." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    )
  }

  clearRateLimit(limitKey)

  const res = NextResponse.json({
    ok: true,
    role: principal.role,
    name: principal.name,
  })
  res.cookies.set(ADMIN_COOKIE_NAME, await createAdminSessionToken(principal), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: getAdminSessionMaxAge(),
  })
  res.headers.set("Cache-Control", "no-store")
  return res
}
