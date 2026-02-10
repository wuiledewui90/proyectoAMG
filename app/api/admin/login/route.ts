import { NextResponse } from "next/server"

const ADMIN_USER = "pancho"
const ADMIN_PASS = "amg2026"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("amg_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // secure: true, // en producción con https
  })
  return res
}
