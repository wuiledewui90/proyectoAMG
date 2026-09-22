import { NextResponse } from "next/server"
import { getRequestAdminSession } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"

type RouteContext = { params: Promise<{ id: string }> }

const paymentLabels: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  CURRENT_ACCOUNT: "Cuenta corriente",
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json(
      { error: "No tenés permiso para emitir facturas." },
      { status: 403 }
    )
  }

  const saleId = Number((await params).id)
  if (!Number.isInteger(saleId)) {
    return NextResponse.json({ error: "Venta inválida." }, { status: 400 })
  }

  const sale = await prisma.erpSale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { id: "asc" } },
    },
  })
  if (!sale || sale.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "La venta no existe o está anulada." },
      { status: 404 }
    )
  }

  const sourceMarker = `Generada desde venta de mostrador #${sale.id}`
  const existing = await prisma.erpDocument.findFirst({
    where: { type: "INVOICE", terms: sourceMarker },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true })
  }

  const invoice = await prisma.erpDocument.create({
    data: {
      type: "INVOICE",
      status: "ISSUED",
      customerId: sale.customerId,
      createdById: session.userId || null,
      customerName: sale.customer?.name || "Consumidor final",
      customerTaxId: sale.customer?.taxId || null,
      customerPhone: sale.customer?.phone || null,
      customerEmail: sale.customer?.email || null,
      customerAddress: sale.customer?.address || null,
      vehicleDescription: [
        sale.customer?.vehicleBrand,
        sale.customer?.vehicleModel,
        sale.customer?.vehicleYear,
      ]
        .filter(Boolean)
        .join(" ") || null,
      vehiclePlate: sale.customer?.vehiclePlate || null,
      issueDate: new Date(),
      subtotal: sale.subtotal,
      discount: sale.discount,
      taxRate: sale.taxRate,
      taxAmount: sale.taxAmount,
      total: sale.total,
      notes: [
        sale.notes,
        sale.paymentMethod === "COMBINED"
          ? `Pago combinado: ${sale.payments
              .map(
                (payment) =>
                  `${paymentLabels[payment.method] || payment.method} $ ${Number(payment.amount).toLocaleString("es-AR")}`
              )
              .join(" · ")}`
          : `Medio de pago: ${paymentLabels[sale.paymentMethod] || sale.paymentMethod}`,
      ]
        .filter(Boolean)
        .join("\n"),
      terms: sourceMarker,
      items: {
        create: sale.items.map((item) => ({
          productId: item.productId,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ id: invoice.id, existing: false }, { status: 201 })
}
