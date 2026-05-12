import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME } from "@/lib/admin-session"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}
