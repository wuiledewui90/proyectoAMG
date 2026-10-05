import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"
import { prepareDocumentInput } from "@/lib/document-input"
import { invoiceStatuses, quoteStatuses, serializeDocument } from "@/lib/documents"

type RouteContext = { params: Promise<{ id: string }> }

const includeDocument = {
  customer: true,
  createdBy: { select: { id: true, name: true } },
  sourceDocument: { select: { id: true, type: true } },
  items: { orderBy: { id: "asc" as const } },
}

export async function GET(req: Request, { params }: RouteContext) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const id = Number((await params).id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Comprobante inválido." }, { status: 400 })
  }
  const document = await prisma.erpDocument.findUnique({ where: { id }, include: includeDocument })
  if (!document) {
    return NextResponse.json({ error: "Comprobante no encontrado." }, { status: 404 })
  }
  return NextResponse.json(serializeDocument(document))
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json({ error: "No tenés permiso para modificar comprobantes." }, { status: 403 })
  }
  const id = Number((await params).id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Comprobante inválido." }, { status: 400 })
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const current = await prisma.erpDocument.findUnique({ where: { id }, include: { items: true } })
  if (!current) {
    return NextResponse.json({ error: "Comprobante no encontrado." }, { status: 404 })
  }

  if (body.action === "update") {
    if (current.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Solo se pueden editar comprobantes en estado borrador." },
        { status: 400 }
      )
    }
    const prepared = await prepareDocumentInput(body)
    if ("error" in prepared) {
      return NextResponse.json({ error: prepared.error }, { status: 400 })
    }
    if (prepared.data.type !== current.type) {
      return NextResponse.json({ error: "No se puede cambiar el tipo de comprobante." }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.erpDocumentItem.deleteMany({ where: { documentId: id } })
      return tx.erpDocument.update({
        where: { id },
        data: {
          ...prepared.data,
          items: { create: prepared.items },
        },
        include: includeDocument,
      })
    })
    return NextResponse.json(serializeDocument(updated))
  }

  if (body.action === "convert") {
    if (current.type === "INVOICE") {
      return NextResponse.json({ error: "Solo se pueden convertir presupuestos o cotizaciones." }, { status: 400 })
    }
    const existing = await prisma.erpDocument.findFirst({
      where: { sourceDocumentId: id, type: "INVOICE" },
      include: includeDocument,
    })
    if (existing) return NextResponse.json(serializeDocument(existing))

    const invoice = await prisma.erpDocument.create({
      data: {
        type: "INVOICE",
        status: "DRAFT",
        customerId: current.customerId,
        createdById: session.userId || null,
        sourceDocumentId: current.id,
        customerName: current.customerName,
        customerTaxId: current.customerTaxId,
        customerPhone: current.customerPhone,
        customerEmail: current.customerEmail,
        customerAddress: current.customerAddress,
        vehicleDescription: current.vehicleDescription,
        vehiclePlate: current.vehiclePlate,
        issueDate: new Date(),
        subtotal: current.subtotal,
        discount: current.discount,
        taxRate: current.taxRate,
        taxAmount: current.taxAmount,
        total: current.total,
        notes: current.notes,
        terms: current.terms,
        items: {
          create: current.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: includeDocument,
    })
    if (current.status === "DRAFT" || current.status === "SENT") {
      await prisma.erpDocument.update({ where: { id }, data: { status: "ACCEPTED" } })
    }
    return NextResponse.json(serializeDocument(invoice), { status: 201 })
  }

  const status = typeof body.status === "string" ? body.status : ""
  const allowed = current.type === "INVOICE" ? invoiceStatuses : quoteStatuses
  if (!(allowed as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Estado inválido para este comprobante." }, { status: 400 })
  }
  const updated = await prisma.erpDocument.update({
    where: { id },
    data: { status: status as never },
    include: includeDocument,
  })
  return NextResponse.json(serializeDocument(updated))
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getRequestAdminSession(req)
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo un administrador puede eliminar comprobantes." },
      { status: 403 }
    )
  }

  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Comprobante inválido." }, { status: 400 })
  }

  const current = await prisma.erpDocument.findUnique({
    where: { id },
    select: { id: true, type: true, status: true },
  })
  if (!current) {
    return NextResponse.json({ error: "Comprobante no encontrado." }, { status: 404 })
  }

  if (current.type === "INVOICE" && current.status !== "DRAFT") {
    return NextResponse.json(
      {
        error:
          "Una factura emitida, pagada o anulada debe conservarse para auditoría. Cambiá su estado a Anulada en lugar de eliminarla.",
      },
      { status: 409 }
    )
  }

  await prisma.erpDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
