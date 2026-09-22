import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionMaxAge,
  getAdminUsername,
  updateAdminSecurity,
  verifyAdminSessionToken,
} from "@/lib/admin-session"

function readSessionCookie(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

export async function PUT(req: Request) {
  if (!(await verifyAdminSessionToken(readSessionCookie(req)))) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { currentPassword, newPassword, newPin } = body as {
    currentPassword?: string
    newPassword?: string
    newPin?: string
  }

  if (!currentPassword || (!newPassword && !newPin)) {
    return NextResponse.json(
      { error: "Completá la contraseña actual y el dato que querés cambiar." },
      { status: 400 }
    )
  }

  if (newPassword && (newPassword.length < 8 || newPassword.length > 128)) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener entre 8 y 128 caracteres." },
      { status: 400 }
    )
  }

  if (newPin && !/^\d{4,8}$/.test(newPin)) {
    return NextResponse.json(
      { error: "El PIN debe contener entre 4 y 8 números." },
      { status: 400 }
    )
  }

  const updated = await updateAdminSecurity({
    username: getAdminUsername(),
    currentPassword,
    newPassword,
    newPin,
  })

  if (!updated) {
    return NextResponse.json(
      { error: "La contraseña actual es incorrecta." },
      { status: 401 }
    )
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
