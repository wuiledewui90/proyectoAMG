/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getRequestAdminSession } from "@/lib/admin-request"
import { argentinaDate } from "@/lib/cash"

type SaleLineInput = {
  productId?: unknown
  description?: unknown
  quantity?: unknown
  unitPrice?: unknown
  kind?: unknown
}
type SalePaymentInput = { method?: unknown; amount?: unknown }

const paymentMethods = ["CASH", "TRANSFER", "CARD", "CURRENT_ACCOUNT"] as const

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function serializeSale(sale: any) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    taxRate: Number(sale.taxRate),
    taxAmount: Number(sale.taxAmount),
    total: Number(sale.total),
    payments: (sale.payments || []).map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    items: (sale.items || []).map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }
}

export async function GET(req: Request) {
  if (!(await getRequestAdminSession(req))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }
  const sales = await prisma.erpSale.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { customer: true, createdBy: true, voidedBy: true, items: true, payments: true },
  })
  return NextResponse.json(sales.map(serializeSale))
}

export async function POST(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || !["ADMIN", "SALES"].includes(session.role || "")) {
    return NextResponse.json({ error: "No tenés permiso para registrar ventas." }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const rawItems = Array.isArray(body.items) ? (body.items as SaleLineInput[]) : []
  const parsedItems = rawItems
    .map((item) => {
      const requestedProductId = Number(item.productId)
      const productId = Number.isInteger(requestedProductId) && requestedProductId > 0
        ? requestedProductId
        : null
      return {
        productId,
        description: optionalText(item.description, 191),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        kind: item.kind === "LABOR" ? "LABOR" : "PRODUCT",
      }
    })
    .filter(
      (item) =>
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        (item.productId !== null ||
          (item.kind === "LABOR" &&
            Boolean(item.description) &&
            Number.isFinite(item.unitPrice) &&
            item.unitPrice >= 0))
    )

  if (!parsedItems.length || parsedItems.length !== rawItems.length || parsedItems.length > 100) {
    return NextResponse.json({ error: "Agregá al menos un producto, servicio o mano de obra válido." }, { status: 400 })
  }

  const paymentMethod = String(body.paymentMethod || "")
  if (![...paymentMethods, "COMBINED"].includes(paymentMethod as never)) {
    return NextResponse.json({ error: "Seleccioná un medio de pago." }, { status: 400 })
  }

  const productIds = [...new Set(parsedItems.flatMap((item) => item.productId ? [item.productId] : []))]
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      })
      if (products.length !== productIds.length) throw new Error("Hay productos inválidos o inactivos.")

      const productsById = new Map(products.map((product) => [product.id, product]))
      const lines = parsedItems.map((item) => {
        if (!item.productId) {
          const unitPrice = item.unitPrice
          return {
            product: null,
            quantity: item.quantity,
            unitPrice,
            productName: item.description || "Mano de obra",
            subtotal: unitPrice * item.quantity,
            affectsStock: false,
          }
        }

        const product = productsById.get(item.productId)
        if (!product) throw new Error("Hay productos inválidos o inactivos.")
        const serviceText = `${product.stockType || ""} ${product.category || ""} ${product.stockCategory || ""}`.toLowerCase()
        const isService = serviceText.includes("servicio") || serviceText.includes("mano de obra")
        if (!isService && product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}.`)
        }
        const unitPrice =
          isService && Number.isFinite(item.unitPrice) && item.unitPrice >= 0
            ? item.unitPrice
            : Number(product.price)
        return {
          product,
          quantity: item.quantity,
          unitPrice,
          productName: isService && item.description ? item.description : product.name,
          subtotal: unitPrice * item.quantity,
          affectsStock: !isService,
        }
      })
      const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0)
      const requestedDiscount = Number(body.discount || 0)
      const discount = Number.isFinite(requestedDiscount)
        ? Math.min(Math.max(requestedDiscount, 0), subtotal)
        : 0
      const requestedTaxRate = Number(body.taxRate || 0)
      const taxRate = Number.isFinite(requestedTaxRate)
        ? Math.min(Math.max(requestedTaxRate, 0), 100)
        : 0
      const taxAmount = (subtotal - discount) * (taxRate / 100)
      const total = subtotal - discount + taxAmount
      const rawPayments = Array.isArray(body.payments)
        ? (body.payments as SalePaymentInput[])
        : []
      let paymentLines: Array<{
        method: (typeof paymentMethods)[number]
        amount: number
      }>

      if (paymentMethod === "COMBINED") {
        paymentLines = rawPayments
          .map((payment) => ({
            method: String(payment.method || "") as (typeof paymentMethods)[number],
            amount: Number(payment.amount),
          }))
          .filter(
            (payment) =>
              paymentMethods.includes(payment.method) &&
              Number.isFinite(payment.amount) &&
              payment.amount > 0
          )

        if (paymentLines.length < 2) {
          throw new Error("El pago combinado necesita al menos dos medios de pago.")
        }
        if (new Set(paymentLines.map((payment) => payment.method)).size !== paymentLines.length) {
          throw new Error("No repitas medios dentro del pago combinado.")
        }
        const distributedTotal = paymentLines.reduce(
          (sum, payment) => sum + payment.amount,
          0
        )
        if (Math.abs(distributedTotal - total) > 0.01) {
          throw new Error("La suma del pago combinado debe coincidir con el total de la venta.")
        }
      } else {
        paymentLines = [
          {
            method: paymentMethod as (typeof paymentMethods)[number],
            amount: total,
          },
        ]
      }

      const requestedCustomerId = Number(body.customerId)
      const enteredName = optionalText(body.customerName, 160)
      const customerName = enteredName || "Consumidor final"
      const customerPhone = optionalText(body.customerPhone, 40)
      const customerEmail = optionalText(body.customerEmail, 191)
      const customerTaxId = optionalText(body.customerTaxId, 40)
      const customerAddress = optionalText(body.customerAddress, 255)
      const vehiclePlate = optionalText(body.vehiclePlate, 20)?.toUpperCase() || null
      const vehicleDescription = optionalText(body.vehicleDescription, 191)
      let customerId: number | null = null

      if (Number.isInteger(requestedCustomerId) && requestedCustomerId > 0) {
        const currentCustomer = await tx.customer.findFirst({
          where: { id: requestedCustomerId, active: true },
        })
        if (!currentCustomer) throw new Error("El cliente seleccionado ya no está disponible.")

        const updatedCustomer = await tx.customer.update({
          where: { id: currentCustomer.id },
          data: {
            ...(enteredName ? { name: enteredName } : {}),
            ...(customerPhone ? { phone: customerPhone } : {}),
            ...(customerEmail ? { email: customerEmail } : {}),
            ...(customerTaxId ? { taxId: customerTaxId } : {}),
            ...(customerAddress ? { address: customerAddress } : {}),
            ...(vehiclePlate ? { vehiclePlate } : {}),
            ...(vehicleDescription ? { vehicleModel: vehicleDescription } : {}),
          },
        })
        customerId = updatedCustomer.id
      } else if (customerName !== "Consumidor final") {
        const identifiers = [
          customerTaxId ? { taxId: customerTaxId } : null,
          customerEmail ? { email: customerEmail } : null,
          customerPhone ? { phone: customerPhone } : null,
        ].filter(Boolean) as Array<
          { taxId: string } | { email: string } | { phone: string }
        >

        const existingCustomer = await tx.customer.findFirst({
          where: {
            active: true,
            ...(identifiers.length
              ? { OR: identifiers }
              : {
                  name: customerName,
                  ...(vehiclePlate ? { vehiclePlate } : {}),
                }),
          },
        })
        const customerData = {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          taxId: customerTaxId,
          address: customerAddress,
          vehiclePlate,
          vehicleModel: vehicleDescription,
        }
        const savedCustomer = existingCustomer
          ? await tx.customer.update({
              where: { id: existingCustomer.id },
              data: customerData,
            })
          : await tx.customer.create({ data: customerData })
        customerId = savedCustomer.id
      }

      const created = await tx.erpSale.create({
        data: {
          customerId,
          createdById: session.userId || null,
          subtotal,
          discount,
          taxRate,
          taxAmount,
          total,
          paymentMethod: paymentMethod as "CASH" | "TRANSFER" | "CARD" | "CURRENT_ACCOUNT" | "COMBINED",
          notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
          items: {
            create: lines.map((line) => ({
              productId: line.product?.id || null,
              productName: line.productName,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              subtotal: line.subtotal,
            })),
          },
          payments: { create: paymentLines },
        },
        include: { customer: true, createdBy: true, items: true, payments: true },
      })

      for (const line of lines) {
        if (!line.product || !line.affectsStock) continue
        const updated = await tx.product.updateMany({
          where: { id: line.product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        if (updated.count !== 1) throw new Error(`El stock de ${line.product.name} cambió. Intentá nuevamente.`)
        await tx.stockMovement.create({
          data: {
            productId: line.product.id,
            createdById: session.userId || null,
            type: "SALE",
            quantity: -line.quantity,
            previousStock: line.product.stock,
            newStock: line.product.stock - line.quantity,
            referenceId: String(created.id),
            notes: `Venta #${created.id}`,
          },
        })
      }
      return created
    })
    return NextResponse.json(serializeSale(sale), { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo registrar la venta." },
      { status: 400 }
    )
  }
}

export async function PATCH(req: Request) {
  const session = await getRequestAdminSession(req)
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No tenés permiso para anular ventas." }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Venta inválida." }, { status: 400 })
  }
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "Ingresá un motivo de anulación de al menos 5 caracteres." },
      { status: 400 }
    )
  }
  if (reason.length > 500) {
    return NextResponse.json(
      { error: "El motivo de anulación no puede superar los 500 caracteres." },
      { status: 400 }
    )
  }
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const current = await tx.erpSale.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, payments: true },
      })
      if (!current || current.status === "VOID") throw new Error("La venta no existe o ya está anulada.")

      const claimed = await tx.erpSale.updateMany({
        where: { id, status: "COMPLETED" },
        data: {
          status: "VOID",
          voidReason: reason,
          voidedAt: new Date(),
          voidedById: session.userId || null,
        },
      })
      if (claimed.count !== 1) throw new Error("La venta ya fue anulada por otra operación.")

      const today = argentinaDate()
      const saleBusinessDate = argentinaDate(current.createdAt)
      const todayCash = await tx.cashSession.findUnique({ where: { businessDate: today } })
      const originalCash = saleBusinessDate === today
        ? todayCash
        : await tx.cashSession.findUnique({ where: { businessDate: saleBusinessDate } })
      let reversalSessionId: number | null = null

      if (saleBusinessDate === today) {
        if (originalCash?.closedAt) {
          throw new Error("La caja de hoy está cerrada. Reabrila antes de anular esta venta.")
        }
      } else if (originalCash?.closedAt) {
        if (!todayCash || todayCash.closedAt) {
          throw new Error(
            "Esta venta pertenece a una jornada anterior. Abrí la caja de hoy para registrar correctamente la devolución."
          )
        }
        reversalSessionId = todayCash.id
      }

      for (const item of current.items) {
        if (!item.productId || !item.product) continue
        const serviceText = `${item.product.stockType || ""} ${item.product.category || ""} ${item.product.stockCategory || ""}`.toLowerCase()
        if (serviceText.includes("servicio") || serviceText.includes("mano de obra")) continue
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            createdById: session.userId || null,
            type: "RETURN",
            quantity: item.quantity,
            previousStock: product.stock - item.quantity,
            newStock: product.stock,
            referenceId: String(id),
            notes: `Anulación venta #${id}: ${reason}`.slice(0, 255),
          },
        })
      }
      await tx.erpDocument.updateMany({
        where: {
          type: "INVOICE",
          terms: `Generada desde venta de mostrador #${id}`,
          status: { not: "VOID" },
        },
        data: { status: "VOID" },
      })

      if (reversalSessionId) {
        const refunds = current.payments.length
          ? current.payments
          : [{ method: current.paymentMethod, amount: current.total }]
        const accountableRefunds = refunds.filter((payment) => payment.method !== "CURRENT_ACCOUNT")
        if (accountableRefunds.length) {
          await tx.cashMovement.createMany({
            data: accountableRefunds.map((payment) => ({
              sessionId: reversalSessionId,
              type: "EXPENSE",
              description: `Devolución por anulación de venta #${id}: ${reason}`.slice(0, 255),
              amount: payment.amount,
              paymentMethod: payment.method,
              createdById: session.userId || null,
            })),
          })
        }
      }

      return tx.erpSale.update({
        where: { id },
        data: {
          status: "VOID",
          voidReason: reason,
          voidedAt: new Date(),
          voidedById: session.userId || null,
        },
        include: { customer: true, createdBy: true, voidedBy: true, items: true, payments: true },
      })
    })
    return NextResponse.json(serializeSale(sale))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo anular." }, { status: 400 })
  }
}
