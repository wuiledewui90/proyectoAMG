import { NextResponse } from "next/server"
import { getRequestAdminSession } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json(
      { error: "No tenés permiso para emitir facturas." },
      { status: 403 }
    )
  }

  const orderId = (await params).id
  const order = await prisma.orderRecord.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } } },
  })

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 })
  }

  const sourceMarker = `Generada desde pedido web ${order.id}`
  const existing = await prisma.erpDocument.findFirst({
    where: { type: "INVOICE", terms: sourceMarker },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true })
  }

  const validProducts = await prisma.product.findMany({
    where: { id: { in: order.items.map((item) => item.productId) } },
    select: { id: true },
  })
  const validProductIds = new Set(validProducts.map((product) => product.id))

  const invoice = await prisma.erpDocument.create({
    data: {
      type: "INVOICE",
      status: "ISSUED",
      createdById: session.userId || null,
      customerName: order.customerName,
      customerPhone: order.customerPhone || null,
      customerEmail: order.customerEmail || null,
      customerAddress: order.address || null,
      issueDate: new Date(),
      subtotal: order.total,
      discount: 0,
      taxRate: 0,
      taxAmount: 0,
      total: order.total,
      notes: order.notes || null,
      terms: sourceMarker,
      items: {
        create: order.items.map((item) => ({
          productId: validProductIds.has(item.productId) ? item.productId : null,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: Number(item.price) * item.quantity,
        })),
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ id: invoice.id, existing: false }, { status: 201 })
}
