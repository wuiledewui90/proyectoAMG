import "server-only"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"

const encoder = new TextEncoder()

export const ADMIN_COOKIE_NAME = "amg_admin_session"

const SESSION_TTL_SECONDS = 60 * 60 * 8
const REMEMBERED_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/
const DUMMY_PASSWORD_HASH = "$2b$12$2Shlf6Z2OPyiykPD90YhU.1bpCOWS3c9N5V7uDC5nCt.4msKXL15y"

export type AdminSessionPayload = {
  user: string
  userId?: string
  name?: string
  role?: "ADMIN" | "SALES" | "TECHNICIAN" | "VIEWER"
  exp: number
}

export type AdminPrincipal = Omit<AdminSessionPayload, "exp">

function base64UrlEncode(input: string) {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = (4 - (normalized.length % 4)) % 4
  return atob(normalized + "=".repeat(padding))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  const bytes = Array.from(new Uint8Array(signature))
  const binary = String.fromCharCode(...bytes)
  return base64UrlEncode(binary)
}

function getRequiredEnv(
  name: "ADMIN_SECRET" | "ADMIN_USER" | "ADMIN_PASS_HASH"
) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function isBcryptHash(value: string) {
  return BCRYPT_HASH_PATTERN.test(value)
}

export function getAdminUsername() {
  return getRequiredEnv("ADMIN_USER")
}

async function validateConfiguredPassword(password: string, configured: string) {
  if (isBcryptHash(configured)) {
    return bcrypt.compare(password, configured)
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASS_HASH debe ser un hash bcrypt en producción.")
  }

  // Compatibilidad temporal para instalaciones antiguas que guardaron la
  // contraseña directamente en ADMIN_PASS_HASH. Al primer acceso correcto se
  // migra automáticamente a un hash bcrypt en la base de datos.
  return timingSafeEqual(password, configured)
}

export async function validateAdminCredentials(
  username?: string,
  password?: string
) {
  return Boolean(await authenticateAdminCredentials(username, password))
}

export async function authenticateAdminCredentials(
  username?: string,
  password?: string
): Promise<AdminPrincipal | null> {
  const adminUser = getAdminUsername()

  if (!username || !password) {
    return null
  }

  if (username === adminUser) {
    const storedCredential = await prisma.adminCredential.findUnique({
      where: { username: adminUser },
    })

    if (storedCredential) {
      const matches = await bcrypt.compare(password, storedCredential.passwordHash)
      return matches
        ? { user: adminUser, name: "Administrador", role: "ADMIN" }
        : null
    }

    const configuredPassword = getRequiredEnv("ADMIN_PASS_HASH")
    const matches = await validateConfiguredPassword(password, configuredPassword)

    if (matches) {
      const passwordHash = isBcryptHash(configuredPassword)
        ? configuredPassword
        : await bcrypt.hash(password, 12)

      await prisma.adminCredential.upsert({
        where: { username: adminUser },
        create: { username: adminUser, passwordHash },
        update: { passwordHash },
      })
    }

    return matches
      ? { user: adminUser, name: "Administrador", role: "ADMIN" }
      : null
  }

  const erpUser = await prisma.erpUser.findUnique({ where: { username } })
  if (!erpUser?.active) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
    return null
  }

  const matches = await bcrypt.compare(password, erpUser.passwordHash)
  if (!matches) return null

  await prisma.erpUser.update({
    where: { id: erpUser.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    user: erpUser.username,
    userId: erpUser.id,
    name: erpUser.name,
    role: erpUser.role,
  }
}

export async function updateAdminSecurity({
  username,
  currentPassword,
  newPassword,
  newPin,
}: {
  username: string
  currentPassword: string
  newPassword?: string
  newPin?: string
}) {
  if (!(await validateAdminCredentials(username, currentPassword))) {
    return false
  }

  await prisma.adminCredential.update({
    where: { username },
    data: {
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 12) } : {}),
      ...(newPin ? { recoveryPinHash: await bcrypt.hash(newPin, 12) } : {}),
    },
  })

  return true
}

export async function recoverAdminPassword({
  username,
  pin,
  newPassword,
}: {
  username: string
  pin: string
  newPassword: string
}) {
  if (username !== getAdminUsername()) return false

  const credential = await prisma.adminCredential.findUnique({
    where: { username },
  })

  if (!credential?.recoveryPinHash) return false

  const pinMatches = await bcrypt.compare(pin, credential.recoveryPinHash)
  if (!pinMatches) return false

  await prisma.adminCredential.update({
    where: { username },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })

  return true
}

export async function createAdminSessionToken(
  principal: AdminPrincipal = {
    user: getAdminUsername(),
    name: "Administrador",
    role: "ADMIN",
  },
  options: { remember?: boolean } = {}
) {
  const maxAge = getAdminSessionMaxAge(options.remember)
  const payload: AdminSessionPayload = {
    ...principal,
    exp: Date.now() + maxAge * 1000,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(encodedPayload, getRequiredEnv("ADMIN_SECRET"))

  return `${encodedPayload}.${signature}`
}

export async function verifyAdminSessionToken(token?: string | null) {
  return Boolean(await readAdminSessionToken(token))
}

export async function readAdminSessionToken(token?: string | null) {
  if (!token) return false

  const [encodedPayload, providedSignature] = token.split(".")
  if (!encodedPayload || !providedSignature) return false

  const expectedSignature = await sign(
    encodedPayload,
    getRequiredEnv("ADMIN_SECRET")
  )

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return false
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as Partial<AdminSessionPayload>

    if (typeof payload.exp !== "number") return false
    if (payload.exp <= Date.now()) return false

    if (payload.user === getAdminUsername() && !payload.userId) {
      return {
        ...payload,
        name: payload.name || "Administrador",
        role: "ADMIN",
      } as AdminSessionPayload
    }

    if (!payload.userId) return false

    const user = await prisma.erpUser.findUnique({
      where: { id: payload.userId },
      select: { username: true, name: true, role: true, active: true },
    })

    if (!user?.active || user.username !== payload.user) return false

    return {
      ...payload,
      name: user.name,
      role: user.role,
    } as AdminSessionPayload
  } catch {
    return false
  }
}

export function getAdminSessionMaxAge(remember = false) {
  return remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS
}
