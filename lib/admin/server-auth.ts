import { cookies } from "next/headers"

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get("amg_admin")?.value === "1"
}
