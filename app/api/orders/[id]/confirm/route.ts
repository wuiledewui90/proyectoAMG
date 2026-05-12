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

function serializeOrder(order: any, items = order.items ?? []) {
  return {
    ...order,
    total: Number(order.total),
    items: items.map((item: any) => ({
      ...item,
      price: Number(item.price),
    })),
  }
}

export async function POST(req: Request, context: RouteContext) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const order = await prisma.$transaction(async (tx) => {
      const [currentOrder] = await tx.$queryRaw<any[]>`
        SELECT * FROM \`Order\` WHERE id = ${id} FOR UPDATE
      `

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND")
      }

      if (currentOrder.status !== "pendiente") {
        throw new Error("ORDER_ALREADY_CONFIRMED")
      }

      const items = await tx.$queryRaw<any[]>`
        SELECT * FROM \`OrderItem\` WHERE orderId = ${id} ORDER BY id ASC
      `

      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            updatedAt: new Date(),
          },
        })

        if (updated.count !== 1) {
          throw new Error(`STOCK:${item.productName}:${item.quantity}`)
        }
      }

      await tx.$executeRaw`
        UPDATE \`Order\`
        SET status = 'confirmado', confirmedAt = NOW(3)
        WHERE id = ${id}
      `

      const [confirmedOrder] = await tx.$queryRaw<any[]>`
        SELECT * FROM \`Order\` WHERE id = ${id}
      `

      return serializeOrder(confirmedOrder, items)
    })

    return NextResponse.json(order)
  } catch (err) {
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    }

    if (err instanceof Error && err.message === "ORDER_ALREADY_CONFIRMED") {
      return NextResponse.json({ error: "La orden ya fue confirmada" }, { status: 409 })
    }

    if (err instanceof Error && err.message.startsWith("STOCK:")) {
      const [, productName, quantity] = err.message.split(":")
      return NextResponse.json(
        { error: `Stock insuficiente para ${productName}. Pedido: ${quantity}` },
        { status: 409 }
      )
    }

    throw err
  }
}
