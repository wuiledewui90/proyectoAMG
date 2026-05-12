import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"
import type { StoredOrder, StoredOrderItem } from "@/lib/orders"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function serializeOrder(order: any) {
  return {
    ...order,
    total: Number(order.total),
    items: (order.items ?? []).map((item: any) => ({
      ...item,
      price: Number(item.price),
    })),
  }
}

function isValidOrderItem(item: Partial<StoredOrderItem>) {
  return (
    Number.isInteger(item.productId) &&
    typeof item.productName === "string" &&
    item.productName.trim().length > 0 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.price === "number" &&
    item.price >= 0
  )
}

export async function GET(req: Request) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.orderRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { id: "asc" } },
    },
  })

  return NextResponse.json(orders.map(serializeOrder))
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<StoredOrder> | null

  if (!body) {
    return NextResponse.json({ error: "Pedido invalido" }, { status: 400 })
  }

  const items = body.items ?? []
  if (
    typeof body.customerName !== "string" ||
    typeof body.customerEmail !== "string" ||
    typeof body.customerPhone !== "string" ||
    typeof body.address !== "string" ||
    items.length === 0 ||
    !items.every(isValidOrderItem)
  ) {
    return NextResponse.json({ error: "Datos del pedido incompletos" }, { status: 400 })
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  try {
    const order = await prisma.orderRecord.create({
      data: {
        id: body.id || `ORD-${Date.now()}`,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim(),
        customerPhone: body.customerPhone.trim(),
        address: body.address.trim(),
        notes: body.notes?.trim() || null,
        total,
        status: "pendiente",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            sku: item.sku,
            brand: item.brand,
            model: item.model,
            category: item.category,
            compatibility: item.compatibility,
          })),
        },
      },
      include: {
        items: { orderBy: { id: "asc" } },
      },
    })

    return NextResponse.json(serializeOrder(order), { status: 201 })
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "La orden ya existe" }, { status: 409 })
    }

    throw err
  }
}
