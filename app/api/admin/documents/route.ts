import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"
import { prepareDocumentInput } from "@/lib/document-input"
import { serializeDocument } from "@/lib/documents"

const includeDocument = {
  customer: true,
  createdBy: { select: { id: true, name: true } },
  sourceDocument: { select: { id: true, type: true } },
  items: { orderBy: { id: "asc" as const } },
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const params = new URL(req.url).searchParams
  const type = params.get("type")
  const status = params.get("status")
  const query = params.get("q")?.trim() || ""
  const documents = await prisma.erpDocument.findMany({
    where: {
      ...(type === "QUOTE" || type === "QUOTATION" || type === "INVOICE" ? { type } : {}),
      ...(status ? { status: status as never } : {}),
      ...(query
        ? {
            OR: [
              { customerName: { contains: query } },
              { customerTaxId: { contains: query } },
              { vehiclePlate: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { issueDate: "desc" },
    take: 300,
    include: includeDocument,
  })

  return NextResponse.json(documents.map(serializeDocument))
}

export async function POST(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json({ error: "No tenés permiso para crear comprobantes." }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const prepared = await prepareDocumentInput(body)
  if ("error" in prepared) {
    return NextResponse.json({ error: prepared.error }, { status: 400 })
  }

  const created = await prisma.$transaction(async (tx) => {
    let customerId = prepared.data.customerId
    const saveCustomer = body.saveCustomer === true

    if (!customerId && saveCustomer && prepared.data.customerName !== "Consumidor final") {
      const identifiers = [
        prepared.data.customerTaxId
          ? { taxId: prepared.data.customerTaxId }
          : null,
        prepared.data.customerEmail
          ? { email: prepared.data.customerEmail }
          : null,
        prepared.data.customerPhone
          ? { phone: prepared.data.customerPhone }
          : null,
      ].filter(Boolean) as Array<
        { taxId: string } | { email: string } | { phone: string }
      >

      const existingCustomer = await tx.customer.findFirst({
        where: {
          active: true,
          ...(identifiers.length
            ? { OR: identifiers }
            : {
                name: prepared.data.customerName,
                ...(prepared.data.vehiclePlate
                  ? { vehiclePlate: prepared.data.vehiclePlate }
                  : {}),
              }),
        },
      })

      const customerData = {
        name: prepared.data.customerName,
        phone: prepared.data.customerPhone,
        email: prepared.data.customerEmail,
        taxId: prepared.data.customerTaxId,
        address: prepared.data.customerAddress,
        vehiclePlate: prepared.data.vehiclePlate,
        vehicleModel: prepared.data.vehicleDescription,
      }

      const savedCustomer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: prepared.data.customerName,
              ...(prepared.data.customerPhone
                ? { phone: prepared.data.customerPhone }
                : {}),
              ...(prepared.data.customerEmail
                ? { email: prepared.data.customerEmail }
                : {}),
              ...(prepared.data.customerTaxId
                ? { taxId: prepared.data.customerTaxId }
                : {}),
              ...(prepared.data.customerAddress
                ? { address: prepared.data.customerAddress }
                : {}),
              ...(prepared.data.vehiclePlate
                ? { vehiclePlate: prepared.data.vehiclePlate }
                : {}),
              ...(prepared.data.vehicleDescription
                ? { vehicleModel: prepared.data.vehicleDescription }
                : {}),
            },
          })
        : await tx.customer.create({ data: customerData })

      customerId = savedCustomer.id
    }

    return tx.erpDocument.create({
      data: {
        ...prepared.data,
        customerId,
        createdById: session.userId || null,
        items: { create: prepared.items },
      },
      include: includeDocument,
    })
  })

  return NextResponse.json(serializeDocument(created), { status: 201 })
}
