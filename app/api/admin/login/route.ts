import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  authenticateAdminCredentials,
  createAdminSessionToken,
  getAdminSessionMaxAge,
} from "@/lib/admin-session"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  const principal = await authenticateAdminCredentials(username, password)
  if (!principal) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

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
  return res
}
