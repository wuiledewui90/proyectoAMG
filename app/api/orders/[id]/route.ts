import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

type RouteContext = {
  params: Promise<{ id: string }>
}

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

export async function DELETE(req: Request, context: RouteContext) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const order = await prisma.orderRecord.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
  }

  await prisma.orderRecord.delete({ where: { id } })

  return NextResponse.json({ ok: true, id })
}
