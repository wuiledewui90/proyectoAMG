import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionMaxAge,
  recoverAdminPassword,
} from "@/lib/admin-session"
import {
  canAttemptAdminRecovery,
  clearAdminRecoveryFailures,
  registerAdminRecoveryFailure,
} from "@/lib/admin-recovery-rate-limit"
import { validatePasswordPolicy } from "@/lib/security/password-policy"
import { getRequestIp } from "@/lib/security/request"

export async function POST(req: Request) {
  const clientKey = getRequestIp(req)

  if (!canAttemptAdminRecovery(clientKey)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá nuevamente en 15 minutos." },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { username, pin, newPassword } = body as {
    username?: string
    pin?: string
    newPassword?: string
  }

  if (
    !username ||
    !pin ||
    !/^\d{4,8}$/.test(pin) ||
    !newPassword
  ) {
    return NextResponse.json(
      { error: "Revisá el usuario, el PIN y la nueva contraseña." },
      { status: 400 }
    )
  }

  const passwordError = validatePasswordPolicy(newPassword, true)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  const recovered = await recoverAdminPassword({ username, pin, newPassword })

  if (!recovered) {
    registerAdminRecoveryFailure(clientKey)
    return NextResponse.json(
      { error: "El usuario o el PIN son incorrectos." },
      { status: 401 }
    )
  }

  clearAdminRecoveryFailures(clientKey)

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
