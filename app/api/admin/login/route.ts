import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionMaxAge,
  validateAdminCredentials,
} from "@/lib/admin-session"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (!(await validateAdminCredentials(username, password))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, await createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: getAdminSessionMaxAge(),
  })
  return res
}
