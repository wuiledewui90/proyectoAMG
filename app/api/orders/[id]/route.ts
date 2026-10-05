import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"
import { isTrustedMutationOrigin } from "@/lib/security/request"

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
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
  }

  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  // El bloqueo impide que una confirmación descuente stock entre la
  // comprobación del estado y la eliminación del pedido.
  const result = await prisma.$transaction(async (tx) => {
    const [order] = await tx.$queryRaw<Array<{ status: string }>>`
      SELECT status FROM \`Order\` WHERE id = ${id} FOR UPDATE
    `
    if (!order) return "missing"
    if (order.status !== "pendiente") return "confirmed"
    await tx.orderRecord.delete({ where: { id } })
    return "deleted"
  })

  if (result === "missing") {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
  }
  if (result === "confirmed") {
    return NextResponse.json(
      { error: "Una orden confirmada no se puede eliminar: su stock ya fue descontado." },
      { status: 409 },
    )
  }

  return NextResponse.json({ ok: true, id })
}
