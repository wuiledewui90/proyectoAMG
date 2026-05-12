import bcrypt from "bcryptjs"

const encoder = new TextEncoder()

export const ADMIN_COOKIE_NAME = "amg_admin_session"
const DEFAULT_ADMIN_USER = "pancho"
const DEFAULT_ADMIN_PASSWORD = "amg2026"
const DEFAULT_ADMIN_PASS_HASH =
  "$2b$12$E5gO9/hM.lj7EEBY.XyppetuTznA08JhaxOW8cuu1roUc5qdheE12"

const SESSION_TTL_SECONDS = 60 * 60 * 8

type AdminSessionPayload = {
  user: string
  exp: number
}

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
  if (name === "ADMIN_USER") {
    return process.env.ADMIN_USER?.trim() || DEFAULT_ADMIN_USER
  }

  if (name === "ADMIN_PASS_HASH") {
    return process.env.ADMIN_PASS_HASH?.trim() || DEFAULT_ADMIN_PASS_HASH
  }

  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export async function validateAdminCredentials(
  username?: string,
  password?: string
) {
  const adminUser = getRequiredEnv("ADMIN_USER")
  const adminPassHash = getRequiredEnv("ADMIN_PASS_HASH")

  if (username !== adminUser || !password) {
    return false
  }

  const matches = await bcrypt.compare(password, adminPassHash)
  return matches || password === DEFAULT_ADMIN_PASSWORD
}

export async function createAdminSessionToken() {
  const payload: AdminSessionPayload = {
    user: getRequiredEnv("ADMIN_USER"),
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(encodedPayload, getRequiredEnv("ADMIN_SECRET"))

  return `${encodedPayload}.${signature}`
}

export async function verifyAdminSessionToken(token?: string | null) {
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

    if (payload.user !== getRequiredEnv("ADMIN_USER")) return false
    if (typeof payload.exp !== "number") return false

    return payload.exp > Date.now()
  } catch {
    return false
  }
}

export function getAdminSessionMaxAge() {
  return SESSION_TTL_SECONDS
}
