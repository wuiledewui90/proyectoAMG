import { cookies } from "next/headers"

export function isAdminAuthenticated(): boolean {
  return cookies().get("amg_admin")?.value === "1"
}
