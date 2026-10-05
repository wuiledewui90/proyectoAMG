import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, readAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"
import { isServiceProduct } from "@/lib/orders/catalog-validation"
import { isTrustedMutationOrigin } from "@/lib/security/request"

export const dynamic = "force-dynamic"
export const revalidate = 0

type RouteContext = {
  params: Promise<{ id: string }>
}

type LockedOrder = Record<string, unknown> & {
  id: string
  status: string
  total: unknown
}

type LockedOrderItem = Record<string, unknown> & {
  id: number
  productId: number
  productName: string
  quantity: number
  price: unknown
  sku: string | null
}

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function serializeOrder(order: LockedOrder, items: LockedOrderItem[] = []) {
  return {
    ...order,
    total: Number(order.total),
    items: items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }
}

export async function POST(req: Request, context: RouteContext) {
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
  }

  const token = getAdminTokenFromCookieHeader(req)
  const session = await readAdminSessionToken(token)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const order = await prisma.$transaction(async (tx) => {
      const [currentOrder] = await tx.$queryRaw<LockedOrder[]>`
        SELECT * FROM \`Order\` WHERE id = ${id} FOR UPDATE
      `

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND")
      }

      if (currentOrder.status !== "pendiente") {
        throw new Error("ORDER_ALREADY_CONFIRMED")
      }

      const items = await tx.$queryRaw<LockedOrderItem[]>`
        SELECT * FROM \`OrderItem\` WHERE orderId = ${id} ORDER BY id ASC
      `

      for (const item of items) {
        let product = item.productId > 0
          ? await tx.product.findUnique({ where: { id: item.productId } })
          : item.sku
            ? await tx.product.findUnique({ where: { sku: item.sku } })
            : null

        if (item.sku && product?.sku?.trim().toLowerCase() !== item.sku.trim().toLowerCase()) {
          product = await tx.product.findUnique({ where: { sku: item.sku } })
        }

        if (!product?.isActive) {
          throw new Error(`PRODUCT_MISSING:${item.productName}`)
        }

        // Los pedidos anteriores a la migración guardaban un ID temporal
        // negativo. Se lo reemplaza por el ID real sin perder el historial.
        if (item.productId !== product.id) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { productId: product.id },
          })
          item.productId = product.id
        }

        if (isServiceProduct(product)) continue

        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            isActive: true,
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

        const currentStock = await tx.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { stock: true },
        })
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            createdById: session.userId || null,
            type: "SALE",
            quantity: -item.quantity,
            previousStock: currentStock.stock + item.quantity,
            newStock: currentStock.stock,
            referenceId: id,
            notes: `Pedido web ${id}`.slice(0, 255),
          },
        })
      }

      await tx.$executeRaw`
        UPDATE \`Order\`
        SET status = 'confirmado', confirmedAt = NOW(3)
        WHERE id = ${id}
      `

      const [confirmedOrder] = await tx.$queryRaw<LockedOrder[]>`
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

    if (err instanceof Error && err.message.startsWith("PRODUCT_MISSING:")) {
      return NextResponse.json(
        { error: "Un producto del pedido ya no existe o está inactivo. Revisá el catálogo antes de confirmar." },
        { status: 409 },
      )
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
