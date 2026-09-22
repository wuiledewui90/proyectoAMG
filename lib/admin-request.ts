import {
  ADMIN_COOKIE_NAME,
  readAdminSessionToken,
  type AdminSessionPayload,
} from "@/lib/admin-session"

export function readAdminToken(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

export async function getRequestAdminSession(
  req: Request
): Promise<AdminSessionPayload | null> {
  const session = await readAdminSessionToken(readAdminToken(req))
  return session || null
}

export async function requireOwnerOrAdmin(req: Request) {
  const session = await getRequestAdminSession(req)
  return session?.role === "ADMIN" ? session : null
}
