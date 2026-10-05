import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { prisma } from "@/lib/db/prisma"
import type { StoredOrder, StoredOrderItem } from "@/lib/orders"
import { getPublicCatalogProducts } from "@/lib/catalog/public-products"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { getRequestIp } from "@/lib/security/request"

export const dynamic = "force-dynamic"
export const revalidate = 0

type OrderItemLike = Record<string, unknown> & { price: unknown }
type OrderLike = Record<string, unknown> & {
  total: unknown
  items?: OrderItemLike[]
}

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function serializeOrder(order: OrderLike) {
  return {
    ...order,
    total: Number(order.total),
    items: (order.items ?? []).map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }
}

function isValidOrderItem(item: Partial<StoredOrderItem>) {
  return (
    Number.isInteger(item.productId) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 100
  )
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
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
  const rateLimit = checkRateLimit(`public-order:${getRequestIp(req)}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados pedidos enviados. Esperá unos minutos antes de volver a intentar." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  const body = (await req.json().catch(() => null)) as Partial<StoredOrder> | null

  if (!body) {
    return NextResponse.json({ error: "Pedido invalido" }, { status: 400 })
  }

  const items = Array.isArray(body.items) ? body.items : []
  const customerName = cleanText(body.customerName, 120)
  const customerEmail = cleanText(body.customerEmail, 160)
  const customerPhone = cleanText(body.customerPhone, 40)
  const address = cleanText(body.address, 240)
  if (
    !customerName ||
    !customerEmail ||
    !/^\S+@\S+\.\S+$/.test(customerEmail) ||
    !customerPhone ||
    !address ||
    items.length === 0 ||
    items.length > 50 ||
    !items.every(isValidOrderItem)
  ) {
    return NextResponse.json({ error: "Datos del pedido incompletos" }, { status: 400 })
  }

  const catalog = await getPublicCatalogProducts()
  const catalogById = new Map(catalog.map((product) => [product.id, product]))
  const verifiedItems = items.map((item) => ({ item, product: catalogById.get(item.productId!) }))

  if (verifiedItems.some(({ product }) => !product || !product.isActive)) {
    return NextResponse.json(
      { error: "Uno o más productos ya no están disponibles." },
      { status: 409 }
    )
  }

  const insufficientStock = verifiedItems.some(({ item, product }) => {
    if (!product) return true
    const isService = product.category?.toLowerCase() === "servicios"
    return !isService && item.quantity! > product.stock
  })

  if (insufficientStock) {
    return NextResponse.json(
      { error: "Uno o más productos no tienen stock suficiente." },
      { status: 409 }
    )
  }

  const total = verifiedItems.reduce(
    (sum, { item, product }) => sum + (product?.price ?? 0) * item.quantity!,
    0
  )

  try {
    const order = await prisma.orderRecord.create({
      data: {
        id: `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        customerName,
        customerEmail,
        customerPhone,
        address,
        notes: cleanText(body.notes, 1000) || null,
        total,
        status: "pendiente",
        items: {
          create: verifiedItems.map(({ item, product }) => ({
            productId: product!.id,
            productName: product!.name,
            quantity: item.quantity!,
            price: product!.price,
            sku: product!.sku,
            brand: product!.brand,
            model: product!.model,
            category: product!.category,
            compatibility: product!.compatibility,
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
