import { NextResponse } from "next/server"
import { getRequestAdminSession } from "@/lib/admin-request"

export async function GET(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  return NextResponse.json({
    user: session.user,
    userId: session.userId,
    name: session.name,
    role: session.role,
  })
}
